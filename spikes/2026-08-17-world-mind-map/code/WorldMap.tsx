import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// Inter, bundled rather than fetched — the spike stays runnable offline.
import '@fontsource-variable/inter';

import { CircleNode, type MapNode, type MapNodeData, type Role } from './CircleNode';
import { Timeline } from './Timeline';
import { nextSpan, type Scale } from './axis';
import {
  addSlotId,
  badgesFor,
  descendantsOf,
  foldAway,
  groupId,
  membersOf,
  openBranches,
  parseAddSlot,
  parseGroup,
  resolveTarget,
  subtitleFor,
  trailTo,
  type Badge,
  type Item,
  type Items,
  type Kind,
  type Parents,
} from './grouping';
import {
  CENTRE_SIZE,
  ITEM_SIZE,
  badgeAngles,
  branchLayout,
  outwardBadgeAngles,
  toCentre,
  toTopLeft,
  wedgeAt,
} from './layout';
import './world-map.css';

// ---------------------------------------------------------------------------
// The world, inline. Nothing is loaded, nothing is saved.
// ---------------------------------------------------------------------------

const WORLD_ID = 'world';

const SEED_ITEMS: Item[] = [
  { id: WORLD_ID, label: 'Aetheria', kind: 'world', x: 0, y: 0 },

  // Events carry a start and an end. What the numbers are called is the
  // world's business, not theirs.
  { id: 'e-sundering', label: 'The Sundering', kind: 'event', x: 0, y: 0, start: 1, end: 14 },
  { id: 'e-coronation', label: 'Coronation of Vela', kind: 'event', x: 0, y: 0, start: 10, end: 22 },
  { id: 'e-siege', label: 'Siege of Ravenhold', kind: 'event', x: 0, y: 0, start: 34, end: 68 },
  { id: 'e-winter', label: 'The Long Winter', kind: 'event', x: 0, y: 0, start: 46, end: 96 },

  { id: 'o-crown', label: 'The Ember Crown', kind: 'object', x: 0, y: 0 },
  { id: 'o-ring', label: "Vela's Ring", kind: 'object', x: 0, y: 0 },
  { id: 'o-ledger', label: 'The Salt Ledger', kind: 'object', x: 0, y: 0 },

  // The Crown's own history: events that belong to an object rather than to
  // the world, which is how a thing comes to have a story of its own.
  { id: 'e-forging', label: 'The Forging', kind: 'event', x: 0, y: 0, start: 2, end: 5 },
  { id: 'e-crownlost', label: 'The Crown is Lost', kind: 'event', x: 0, y: 0, start: 62, end: 66 },
];

// Everything in a world belongs somewhere in it. Nothing floats.
const SEED_PARENTS: Parents = {
  'e-sundering': WORLD_ID,
  'e-coronation': WORLD_ID,
  'e-siege': WORLD_ID,
  'e-winter': WORLD_ID,
  'o-crown': WORLD_ID,
  'o-ring': WORLD_ID,
  'o-ledger': 'e-siege', // the Ledger was taken at Ravenhold
  'e-forging': 'o-crown', // and these two happened to the Crown
  'e-crownlost': 'o-crown',
};

/** What a card is, before the live bits (highlight, rename) are stitched on. */
type CardSpec = {
  label: string;
  subtitle: string;
  kind: Kind;
  role: Role;
  isAdd: boolean;
  badges: Badge[];
  badgeAt: number[];
  open: string[];
};

export const sizeOf = (data: { role: string }) =>
  data.role === 'centre' ? CENTRE_SIZE : ITEM_SIZE;

// ---------------------------------------------------------------------------

const blankData = {
  dropTarget: false,
  editing: false,
  onRename: () => {},
  onEditDone: () => {},
  onToggleBranch: () => {},
};

/**
 * The whole picture. The world sits at the origin and never moves; every open
 * category grows out of it as a branch, in the direction its badge points, and
 * a card on a branch can open branches of its own further out.
 */
function buildNodes(items: Items, parents: Parents, open: Set<string>) {
  const nodes: MapNode[] = [];
  const edges: Edge[] = [];

  const make = (id: string, spec: CardSpec, centre: { x: number; y: number }) => {
    const size = sizeOf(spec);
    nodes.push({
      id,
      type: 'circle' as const,
      position: toTopLeft(centre, size),
      draggable: spec.role !== 'centre' && !spec.isAdd,
      style: { width: size, height: size },
      data: { ...blankData, ...spec } as MapNodeData,
    });
  };

  const join = (from: string, to: string, dashed: boolean) => {
    edges.push({
      id: `${from}->${to}`,
      source: from,
      target: to,
      type: 'straight',
      style: dashed
        ? { stroke: 'rgba(231, 233, 236, 0.14)', strokeWidth: 1.5, strokeDasharray: '4 5' }
        : { stroke: 'rgba(231, 233, 236, 0.26)', strokeWidth: 1.5 },
    });
  };

  const grow = (
    cardId: string,
    cardCentre: { x: number; y: number },
    cardSize: number,
    badges: Badge[],
    badgeAt: number[],
    depth: number,
  ) => {
    const openHere = badges.filter((badge) => open.has(badge.id));

    badges.forEach((badge, i) => {
      if (!open.has(badge.id)) return;

      const direction = badgeAt[i];
      const members = membersOf(cardId, badge.kind, items, parents);
      // The last place on the arc is somewhere to make another one.
      const places = branchLayout(
        members.length + 1,
        cardSize,
        direction,
        wedgeAt(depth, openHere.length),
      );

      members.forEach((memberId, m) => {
        const centre = { x: cardCentre.x + places[m].x, y: cardCentre.y + places[m].y };
        const outward = Math.atan2(centre.y - cardCentre.y, centre.x - cardCentre.x);
        const memberBadges = badgesFor(memberId, items, parents);
        const memberAt = outwardBadgeAngles(memberBadges.length, outward);

        make(
          memberId,
          {
            label: items[memberId].label,
            subtitle: '',
            kind: items[memberId].kind,
            role: 'ring',
            isAdd: false,
            badges: memberBadges,
            badgeAt: memberAt,
            open: memberBadges.filter((b) => open.has(b.id)).map((b) => b.id),
          },
          centre,
        );
        join(cardId, memberId, false);

        grow(memberId, centre, ITEM_SIZE, memberBadges, memberAt, depth + 1);
      });

      const last = places[members.length];
      const slot = addSlotId(badge.id);
      make(
        slot,
        {
          label: badge.kind === 'event' ? 'New event' : 'New object',
          subtitle: '',
          kind: badge.kind,
          role: 'ring',
          isAdd: true,
          badges: [],
          badgeAt: [],
          open: [],
        },
        { x: cardCentre.x + last.x, y: cardCentre.y + last.y },
      );
      join(cardId, slot, true);
    });
  };

  const worldBadges = badgesFor(WORLD_ID, items, parents);
  // The world has no outward, so its badges keep their even spread.
  const worldAt = badgeAngles(worldBadges.length);

  make(
    WORLD_ID,
    {
      label: items[WORLD_ID].label,
      subtitle: subtitleFor(WORLD_ID, items, parents),
      kind: 'world',
      role: 'centre',
      isAdd: false,
      badges: worldBadges,
      badgeAt: worldAt,
      open: worldBadges.filter((b) => open.has(b.id)).map((b) => b.id),
    },
    { x: 0, y: 0 },
  );

  grow(WORLD_ID, { x: 0, y: 0 }, CENTRE_SIZE, worldBadges, worldAt, 0);

  return { nodes, edges };
}

const nodeTypes = { circle: CircleNode };
let nextId = 1;

/** The world itself is held one level up, so both views read the same one. */
type WorldState = {
  items: Items;
  setItems: Dispatch<SetStateAction<Items>>;
  parents: Parents;
  setParents: Dispatch<SetStateAction<Parents>>;
  open: Set<string>;
  setOpen: Dispatch<SetStateAction<Set<string>>>;
};

// ---------------------------------------------------------------------------

function WorldMapCanvas({ items, setItems, parents, setParents, open, setOpen }: WorldState) {
  const { fitView } = useReactFlow();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only
    useMemo(() => buildNodes(items, parents, open).nodes, []),
  );
  const [edges, setEdges] = useState<Edge[]>(
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only
    useMemo(() => buildNodes(items, parents, open).edges, []),
  );

  // A card that has just been named: where it was drafted, so it can be seen
  // travelling from there into its place on the branch.
  const [arrival, setArrival] = useState<{ id: string; from: { x: number; y: number } } | null>(
    null,
  );

  // The picture is rebuilt whenever the world or what is open changes — never
  // mid-drag, since none of these move while a card is in the hand.
  useEffect(() => {
    const built = buildNodes(items, parents, open);
    setEdges(built.edges);
    setNodes(
      arrival
        ? built.nodes.map((n) => ({
            ...n,
            // Everything slides while one card arrives: the branch re-spaces to
            // make room for it, and that is worth watching.
            className: 'shifting',
            position: n.id === arrival.id ? arrival.from : n.position,
          }))
        : built.nodes,
    );
  }, [items, parents, open, arrival, setNodes]);

  // One frame later the new card is released to its real place, and the
  // transition carries it there.
  useEffect(() => {
    if (!arrival) return;
    const landing = buildNodes(items, parents, open).nodes.find((n) => n.id === arrival.id);
    const frame = requestAnimationFrame(() => {
      if (landing) {
        setNodes((ns) =>
          ns.map((n) => (n.id === arrival.id ? { ...n, position: landing.position } : n)),
        );
      }
      fitView({ padding: 0.18, duration: 480 });
    });
    const done = setTimeout(() => setArrival(null), 620);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [arrival, items, parents, open, setNodes, fitView]);

  // The `fitView` prop alone does not survive the first paint here — nodes are
  // not measured yet when it fires. Fit once they have real sizes, and again
  // whenever a branch opens or closes.
  const nodesReady = useNodesInitialized();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (nodesReady && !hasFitted.current) {
      hasFitted.current = true;
      fitView({ padding: 0.18, duration: 0 });
    }
  }, [nodesReady, fitView]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.18, duration: 420 }), 40);
    return () => clearTimeout(t);
  }, [open, fitView]);

  /** Naming the draft is what brings the card into being, and onto the branch. */
  const createCard = useCallback(
    (kind: Kind, owner: string, label: string) => {
      const id = `n-${nextId++}`;
      const slot = nodes.find((n) => n.data.isAdd && n.data.kind === kind);

      setItems((prev) => ({
        ...prev,
        // A new event lands just after everything already written; an object
        // never sits on the axis at all.
        [id]: { id, label, kind, x: 0, y: 0, ...(kind === 'event' ? nextSpan(prev) : {}) },
      }));
      setParents((prev) => ({ ...prev, [id]: owner }));
      setArrival({ id, from: slot ? slot.position : { x: 0, y: 0 } });
    },
    [nodes, setItems, setParents],
  );

  const rename = useCallback(
    (id: string, label: string) => {
      // The empty slot borrows the rename channel: a name typed there makes a
      // card, and a blank one makes nothing.
      const slot = parseAddSlot(id);
      if (slot) {
        if (label) createCard(slot.kind, slot.owner, label);
        return;
      }
      setItems((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], label } } : prev));
    },
    [createCard, setItems],
  );
  const stopEditing = useCallback(() => setEditingId(null), []);

  /** A badge is a category. Pressing it grows that branch, or folds it away. */
  const toggleBranch = useCallback(
    (categoryId: string) => {
      setEditingId(null);
      setOpen((prev) =>
        prev.has(categoryId)
          ? foldAway([categoryId], items, parents, prev, WORLD_ID)
          : new Set(prev).add(categoryId),
      );
    },
    [items, parents, setOpen],
  );

  /** Which card is this one being held over? Nearest overlapping centre wins. */
  const hitTest = useCallback(
    (dragged: MapNode, all: MapNode[]) => {
      const banned = descendantsOf(dragged.id, parents);
      const from = toCentre(dragged.position, sizeOf(dragged.data));
      let best: { id: string; d: number } | null = null;

      for (const n of all) {
        // The empty slot is somewhere to press, never somewhere to land.
        if (n.id === dragged.id || n.data.isAdd || banned.has(resolveTarget(n.id))) continue;
        const to = toCentre(n.position, sizeOf(n.data));
        const d = Math.hypot(to.x - from.x, to.y - from.y);
        const reach = (sizeOf(n.data) / 2 + sizeOf(dragged.data) / 2) * 0.85;
        if (d < reach && (!best || d < best.d)) best = { id: n.id, d };
      }
      return best?.id ?? null;
    },
    [parents],
  );

  // A drag that ends on top of the card being dragged also fires a DOM click,
  // which would otherwise read as a press on it the instant you place it.
  const didDrag = useRef(false);

  const onNodeDrag = useCallback(
    (_: unknown, node: MapNode) => {
      didDrag.current = true;
      setDropTargetId(hitTest(node, nodes));
    },
    [hitTest, nodes],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: MapNode) => {
      setDropTargetId(null);
      setTimeout(() => (didDrag.current = false), 0);
      const target = hitTest(node, nodes);
      // Dropped on a card: it belongs to that card now.
      // Dropped on empty canvas: it goes back to the top of the world.
      const parent = target ? resolveTarget(target) : WORLD_ID;
      setParents((prev) => ({ ...prev, [node.id]: parent }));
    },
    [hitTest, nodes, setParents],
  );

  /**
   * Pressing a card folds away whatever it has open. A card with nothing open
   * has nothing to fold, so the press renames it instead — which makes the
   * world's own card the way to put the whole map away.
   */
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (didDrag.current) return;

      if (parseAddSlot(node.id)) {
        setEditingId(node.id);
        return;
      }

      const mine = openBranches(node.id, items, parents, open);
      if (mine.length > 0) {
        setEditingId(null);
        setOpen((prev) => foldAway(mine.map((b) => b.id), items, parents, prev, WORLD_ID));
        return;
      }
      setEditingId(node.id);
    },
    [items, parents, open, setOpen],
  );

  /** The toolbar acts on the world: open that branch, and start a card on it. */
  const startDraft = useCallback(
    (kind: Kind) => {
      const category = groupId(WORLD_ID, kind);
      setOpen((prev) => new Set(prev).add(category));
      setEditingId(addSlotId(category));
    },
    [setOpen],
  );

  const renderNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          editing: n.id === editingId,
          dropTarget: n.id === dropTargetId,
          onRename: rename,
          onEditDone: stopEditing,
          onToggleBranch: toggleBranch,
        },
      })),
    [nodes, editingId, dropTargetId, rename, stopEditing, toggleBranch],
  );

  const inWorld = Object.values(items).filter((i) => i.kind !== 'world').length;
  const showing = nodes.filter((n) => n.data.role === 'ring' && !n.data.isAdd).length;

  return (
    <ReactFlow
      nodes={renderNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onNodeClick={onNodeClick}
      nodeDragThreshold={5}
      nodesConnectable={false}
      minZoom={0.15}
      maxZoom={2}
      fitView
      fitViewOptions={{ padding: 0.18 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2e3136" />
      <Controls showInteractive={false} />

      <Panel position="top-left" className="toolbar">
        <div className="toolbar-title">{items[WORLD_ID].label}</div>
        <div className="toolbar-hint">
          Press a badge to grow that branch, or press a card to fold away what it has open.
          Press a card with nothing open to rename it. Drag a card onto another to make it
          belong there.
        </div>
        <div className="toolbar-actions">
          <button onClick={() => startDraft('event')}>+ Event</button>
          <button onClick={() => startDraft('object')}>+ Object</button>
        </div>
        <div className="toolbar-count">
          {showing === 0 ? `${inWorld} things, all folded away` : `${showing} of ${inWorld} showing`}
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function WorldMap() {
  const [items, setItems] = useState<Items>(() =>
    Object.fromEntries(SEED_ITEMS.map((i) => [i.id, i])),
  );
  const [parents, setParents] = useState<Parents>(SEED_PARENTS);
  const [open, setOpen] = useState<Set<string>>(() => new Set([groupId(WORLD_ID, 'event')]));
  const [view, setView] = useState<'map' | 'timeline'>('map');
  // What the numbers on the axis are called. A property of the world, not of
  // any event on it.
  const [scale, setScale] = useState<Scale>('pages');
  // Whose story the timeline is showing: the world's, or one object's.
  const [subject, setSubject] = useState<string>(WORLD_ID);

  const world = { items, setItems, parents, setParents, open, setOpen };

  return (
    // Sized inline as well as in CSS: in dev the stylesheet arrives after the
    // first render, and React Flow refuses to measure anything inside a
    // zero-sized container.
    <div className="world-map-root" style={{ position: 'fixed', inset: 0 }}>
      <div className="view-switch">
        <button className={view === 'map' ? 'on' : ''} onClick={() => setView('map')}>
          Map
        </button>
        <button className={view === 'timeline' ? 'on' : ''} onClick={() => setView('timeline')}>
          Timeline
        </button>
      </div>

      {view === 'map' ? (
        // The world is held above the provider, so switching views costs
        // nothing but the pan and zoom.
        <ReactFlowProvider>
          <WorldMapCanvas {...world} />
        </ReactFlowProvider>
      ) : (
        <Timeline
          items={items}
          setItems={setItems}
          parents={parents}
          worldId={WORLD_ID}
          scale={scale}
          setScale={setScale}
          subject={subject}
          setSubject={setSubject}
          onOpen={(id) => {
            // Handing a card to the map: grow every branch on the way down to
            // it, so it is standing there when the map appears.
            const path = trailTo(id, items, parents).filter((step) => parseGroup(step));
            setOpen((prev) => new Set([...prev, ...path]));
            setView('map');
          }}
        />
      )}
    </div>
  );
}
