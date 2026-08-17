import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { CircleNode, type MapNode, type MapNodeData, type Role } from './CircleNode';
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
  type Badge,
  type Item,
  type Items,
  type Kind,
  type Parents,
} from './grouping';
import { CENTRE_SIZE, ITEM_SIZE, ringPositions, toCentre, toTopLeft } from './layout';
import './world-map.css';

// ---------------------------------------------------------------------------
// The world, inline. Nothing is loaded, nothing is saved.
// ---------------------------------------------------------------------------

const WORLD_ID = 'world';

const SEED_ITEMS: Item[] = [
  { id: WORLD_ID, label: 'Aetheria', kind: 'world', x: 0, y: 0 },

  { id: 'e-sundering', label: 'The Sundering', kind: 'event', x: 0, y: 0 },
  { id: 'e-coronation', label: 'Coronation of Vela', kind: 'event', x: 0, y: 0 },
  { id: 'e-siege', label: 'Siege of Ravenhold', kind: 'event', x: 0, y: 0 },
  { id: 'e-winter', label: 'The Long Winter', kind: 'event', x: 0, y: 0 },
  { id: 'o-crown', label: 'The Ember Crown', kind: 'object', x: 0, y: 0 },
  { id: 'o-ring', label: "Vela's Ring", kind: 'object', x: 0, y: 0 },
  { id: 'o-ledger', label: 'The Salt Ledger', kind: 'object', x: 0, y: 0 },
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
  // A category's ring ends in an empty place to press, so a new member is made
  // where it will stand rather than from a button in the corner.
  const slots = category ? ring.length + 1 : ring.length;
  const positions = ringPositions(slots);

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

  if (category) {
    nodes.push(
      make(
        addSlotId(focus),
        {
          label: category.kind === 'event' ? 'New event' : 'New object',
          subtitle: '',
          kind: category.kind,
          role: 'ring',
          isGroup: false,
          isAdd: true,
          badges: [],
        },
        positions[slots - 1],
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

function WorldMapCanvas() {
  const { fitView } = useReactFlow();

  const [items, setItems] = useState<Items>(() =>
    Object.fromEntries(SEED_ITEMS.map((i) => [i.id, i])),
  );
  const [parents, setParents] = useState<Parents>(SEED_PARENTS);
  const [trail, setTrail] = useState<string[]>([WORLD_ID]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const focus = trail[trail.length - 1];

  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(
    useMemo(
      () =>
        buildNodes(
          Object.fromEntries(SEED_ITEMS.map((i) => [i.id, i])),
          SEED_PARENTS,
          WORLD_ID,
        ),
      [],
    ),
  );

  // The picture is rebuilt whenever the world or the depth changes — never
  // mid-drag, since none of these move while a card is in the hand.
  useEffect(() => {
    setNodes(buildNodes(items, parents, focus));
  }, [items, parents, focus, setNodes]);

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

  const rename = useCallback((id: string, label: string) => {
    setItems((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], label } } : prev));
  }, []);
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
   * card it hangs off — and the map goes to the category that now holds it, so
   * you can see and name the thing you just made.
   */
  const addCard = useCallback(
    (kind: Kind) => {
      const owner = resolveTarget(focus);
      const id = `n-${nextId++}`;

      setItems((prev) => ({
        ...prev,
        [id]: { id, label: kind === 'event' ? 'New event' : 'New object', kind, x: 0, y: 0 },
      }));
      setParents((prev) => ({ ...prev, [id]: owner }));

      const category = groupId(owner, kind);
      setTrail((t) => {
        const here = t[t.length - 1];
        if (here === category) return t;
        // Swapping from one category of the same card to another replaces the
        // crumb rather than burrowing.
        return [...(parseGroup(here) ? t.slice(0, -1) : t), category];
      });
      setEditingId(id);
    },
    [focus],
  );

  // Press the empty slot to make one. Click the middle to rename it. Click
  // anything else to go into it.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (didDrag.current) return;

      const slot = parseAddSlot(node.id);
      if (slot) {
        addCard(slot.kind);
        return;
      }

      if (node.id === focus) {
        if (!parseGroup(node.id)) setEditingId(node.id);
        return;
      }
      setEditingId(null);
      setTrail((t) => [...t, node.id]);
    },
    [focus, addCard],
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
          style: n.data.isAdd
            ? { stroke: 'rgba(226, 214, 190, 0.16)', strokeWidth: 1.5, strokeDasharray: '4 5' }
            : { stroke: 'rgba(226, 214, 190, 0.3)', strokeWidth: 1.5 },
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
    // Sized inline as well as in CSS: in dev the stylesheet arrives after the
    // first render, and React Flow refuses to measure anything inside a
    // zero-sized container.
    <div className="world-map-root" style={{ position: 'fixed', inset: 0 }}>
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
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2b3040" />
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
            <button onClick={() => addCard('event')}>+ Event</button>
            <button onClick={() => addCard('object')}>+ Object</button>
          </div>
          <div className="toolbar-count">
            {centreHolds
              ? `${inWorld} things in ${labelOf(WORLD_ID, items)}`
              : `Nothing belongs to ${labelOf(focus, items)} yet`}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function WorldMap() {
  return (
    <ReactFlowProvider>
      <WorldMapCanvas />
    </ReactFlowProvider>
  );
}
