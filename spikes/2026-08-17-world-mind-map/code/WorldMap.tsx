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
  groupId,
  kindOf,
  labelOf,
  parseAddSlot,
  parseGroup,
  resolveTarget,
  ringEntries,
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
  ringPositions,
  ringRadius,
  toCentre,
  toTopLeft,
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
  isGroup: boolean;
  isAdd: boolean;
  badges: Badge[];
};

export const sizeOf = (data: { role: string }) =>
  data.role === 'centre' ? CENTRE_SIZE : ITEM_SIZE;

// ---------------------------------------------------------------------------

const blankData = {
  dropTarget: false,
  editing: false,
  onRename: () => {},
  onEditDone: () => {},
  onOpenBadge: () => {},
};

/** The whole picture, from the focus down one level, plus whatever is adrift. */
function buildNodes(items: Items, parents: Parents, focus: string): MapNode[] {
  const make = (id: string, spec: CardSpec, centre: { x: number; y: number }): MapNode => {
    const size = sizeOf(spec);
    return {
      id,
      type: 'circle' as const,
      position: toTopLeft(centre, size),
      draggable: spec.role !== 'centre' && !spec.isGroup && !spec.isAdd,
      style: { width: size, height: size },
      data: { ...blankData, ...spec } as MapNodeData,
    };
  };

  const badges = (id: string) => badgesFor(id, items, parents);

  const category = parseGroup(focus);

  const nodes: MapNode[] = [
    make(
      focus,
      {
        label: labelOf(focus, items),
        subtitle: subtitleFor(focus, items, parents),
        kind: kindOf(focus, items),
        role: 'centre',
        isGroup: !!category,
        isAdd: false,
        badges: badges(focus),
      },
      { x: 0, y: 0 },
    ),
  ];

  const ring = ringEntries(focus, items, parents);
  const positions = ringPositions(ring.length);

  ring.forEach((entry, i) => {
    nodes.push(
      make(
        entry.id,
        {
          label: entry.label,
          subtitle: '',
          kind: entry.kind,
          role: 'ring',
          isGroup: entry.isGroup,
          isAdd: false,
          badges: badges(entry.id),
        },
        positions[i],
      ),
    );
  });

  // Somewhere to make another one: a sibling in look, but standing off to the
  // left on its own, outside the ring and joined to nothing.
  if (category) {
    nodes.push(
      make(
        addSlotId(focus),
        {
          label: category.kind === 'event' ? 'New event' : 'New object',
          subtitle: '',
          kind: category.kind,
          role: 'loose',
          isGroup: false,
          isAdd: true,
          badges: [],
        },
        { x: -(ringRadius(ring.length) + ITEM_SIZE + 96), y: 0 },
      ),
    );
  }

  // Cards that belong to nothing are visible at every depth — they have to be,
  // or there would be nowhere to drag them from.
  for (const item of Object.values(items)) {
    if (item.kind === 'world' || parents[item.id] || item.id === focus) continue;
    nodes.push(
      make(
        item.id,
        {
          label: item.label,
          subtitle: '',
          kind: item.kind,
          role: 'loose',
          isGroup: false,
          isAdd: false,
          badges: badges(item.id),
        },
        toCentre({ x: item.x, y: item.y }, ITEM_SIZE),
      ),
    );
  }

  return nodes;
}

const nodeTypes = { circle: CircleNode };
let nextId = 1;

// ---------------------------------------------------------------------------

/** The world itself is held one level up, so both views read the same one. */
type WorldState = {
  items: Items;
  setItems: Dispatch<SetStateAction<Items>>;
  parents: Parents;
  setParents: Dispatch<SetStateAction<Parents>>;
  trail: string[];
  setTrail: Dispatch<SetStateAction<string[]>>;
};

function WorldMapCanvas({ items, setItems, parents, setParents, trail, setTrail }: WorldState) {
  const { fitView } = useReactFlow();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const focus = trail[trail.length - 1];

  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only
    useMemo(() => buildNodes(items, parents, focus), []),
  );

  // A card that has just been named: where it was drafted, so it can be seen
  // travelling from there into its place in the ring.
  const [arrival, setArrival] = useState<{ id: string; from: { x: number; y: number } } | null>(
    null,
  );

  // The picture is rebuilt whenever the world or the depth changes — never
  // mid-drag, since none of these move while a card is in the hand.
  useEffect(() => {
    const built = buildNodes(items, parents, focus);
    setNodes(
      arrival
        ? built.map((n) => ({
            ...n,
            // Everything slides while one card arrives: the ring re-spaces to
            // make room for it, and that is worth watching.
            className: 'shifting',
            position: n.id === arrival.id ? arrival.from : n.position,
          }))
        : built,
    );
  }, [items, parents, focus, arrival, setNodes]);

  // One frame later the new card is released to its real place, and the
  // transition carries it there.
  useEffect(() => {
    if (!arrival) return;
    const landing = buildNodes(items, parents, focus).find((n) => n.id === arrival.id);
    const frame = requestAnimationFrame(() => {
      if (landing) {
        setNodes((ns) =>
          ns.map((n) => (n.id === arrival.id ? { ...n, position: landing.position } : n)),
        );
      }
      // The ring grows as it takes another member, so the view eases out with
      // it rather than letting the new card land off the edge.
      fitView({ padding: 0.22, duration: 480 });
    });
    const done = setTimeout(() => setArrival(null), 620);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [arrival, items, parents, focus, setNodes, fitView]);

  // The `fitView` prop alone does not survive the first paint here — nodes are
  // not measured yet when it fires. Fit once they have real sizes, and again
  // whenever the depth changes.
  const nodesReady = useNodesInitialized();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (nodesReady && !hasFitted.current) {
      hasFitted.current = true;
      fitView({ padding: 0.22, duration: 0 });
    }
  }, [nodesReady, fitView]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.22, duration: 400 }), 40);
    return () => clearTimeout(t);
  }, [trail, fitView]);

  /** Naming the draft is what brings the card into being, and into the ring. */
  const createCard = useCallback(
    (kind: Kind, owner: string, label: string) => {
      const id = `n-${nextId++}`;
      const slot = nodes.find((n) => n.data.isAdd);

      setItems((prev) => ({
        ...prev,
        // A new event lands just after everything already written; an object
        // never sits on the axis at all.
        [id]: { id, label, kind, x: 0, y: 0, ...(kind === 'event' ? nextSpan(prev) : {}) },
      }));
      setParents((prev) => ({ ...prev, [id]: owner }));
      setArrival({ id, from: slot ? slot.position : { x: 0, y: 0 } });
    },
    [nodes],
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
    [createCard],
  );
  const stopEditing = useCallback(() => setEditingId(null), []);

  /** A badge on the middle card is a category; clicking it goes there. */
  const openBadge = useCallback((badgeId: string) => {
    setEditingId(null);
    setTrail((t) => [...t, badgeId]);
  }, []);

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
  // which would otherwise read as "go into this" the instant you place it.
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
      // Dropped on empty canvas: it goes back to the top of the world. Nothing
      // is ever orphaned, so there is nothing floating to look at.
      const parent = target ? resolveTarget(target) : WORLD_ID;
      setParents((prev) => ({ ...prev, [node.id]: parent }));
    },
    [hitTest, nodes],
  );

  /**
   * A new card belongs to whatever is in the middle — through a category to the
   * card it hangs off. Pressing the toolbar goes to that category and opens the
   * draft there, so a card is always named in the place it will stand.
   */
  const startDraft = useCallback(
    (kind: Kind) => {
      const category = groupId(resolveTarget(focus), kind);
      setTrail((t) => {
        const here = t[t.length - 1];
        if (here === category) return t;
        // Swapping from one category of the same card to another replaces the
        // crumb rather than burrowing.
        return [...(parseGroup(here) ? t.slice(0, -1) : t), category];
      });
      setEditingId(addSlotId(category));
    },
    [focus],
  );

  // Press the empty slot to name one. Click the middle to rename it. Click
  // anything else to go into it.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (didDrag.current) return;

      if (parseAddSlot(node.id)) {
        setEditingId(node.id);
        return;
      }

      if (node.id === focus) {
        if (!parseGroup(node.id)) setEditingId(node.id);
        return;
      }
      setEditingId(null);
      setTrail((t) => [...t, node.id]);
    },
    [focus],
  );

  const edges: Edge[] = useMemo(
    () =>
      nodes
        .filter((n) => n.data.role === 'ring')
        .map((n) => ({
          id: `${focus}->${n.id}`,
          source: focus,
          target: n.id,
          type: 'straight',
          style: { stroke: 'rgba(231, 233, 236, 0.28)', strokeWidth: 1.5 },
        })),
    [nodes, focus],
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
          onOpenBadge: openBadge,
        },
      })),
    [nodes, editingId, dropTargetId, rename, stopEditing, openBadge],
  );

  const inWorld = Object.values(items).filter((i) => i.kind !== 'world').length;
  // A card in the middle holds things through its badges, not through a ring.
  const centreHolds = nodes.some(
    (n) => n.data.role === 'ring' || (n.data.role === 'centre' && n.data.badges.length > 0),
  );

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
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.22 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2e3136" />
        <Controls showInteractive={false} />

        <Panel position="top-center" className="breadcrumb">
          {trail.map((id, i) => (
            <span key={id}>
              {i > 0 && <span className="crumb-sep">›</span>}
              <button
                className={i === trail.length - 1 ? 'crumb here' : 'crumb'}
                onClick={() => setTrail((t) => t.slice(0, i + 1))}
              >
                {labelOf(id, items)}
              </button>
            </span>
          ))}
        </Panel>

        <Panel position="top-left" className="toolbar">
          <div className="toolbar-title">World map</div>
          <div className="toolbar-hint">
            Drag a card onto another to make it belong there. Drop it on empty space to send it
            back to the world. Click a badge to open that category, a card to go into it, and the
            middle card to rename it.
          </div>
          <div className="toolbar-actions">
            <button onClick={() => startDraft('event')}>+ Event</button>
            <button onClick={() => startDraft('object')}>+ Object</button>
          </div>
          <div className="toolbar-count">
            {centreHolds
              ? `${inWorld} things in ${labelOf(WORLD_ID, items)}`
              : `Nothing belongs to ${labelOf(focus, items)} yet`}
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
  const [trail, setTrail] = useState<string[]>([WORLD_ID]);
  const [view, setView] = useState<'map' | 'timeline'>('map');
  // What the numbers on the axis are called. A property of the world, not of
  // any event on it.
  const [scale, setScale] = useState<Scale>('pages');
  // Whose story the timeline is showing: the world's, or one object's.
  const [subject, setSubject] = useState<string>(WORLD_ID);

  const world = { items, setItems, parents, setParents, trail, setTrail };

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
            // Handing a card to the map: it opens exactly where that card lives.
            setTrail(trailTo(id, items, parents));
            setView('map');
          }}
        />
      )}
    </div>
  );
}
