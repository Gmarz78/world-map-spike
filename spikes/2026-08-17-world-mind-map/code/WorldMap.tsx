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

import { CircleNode, type MapNode, type MapNodeData, type Kind } from './CircleNode';
import { radialLayout, sizeOf, toTopLeft, toCentre } from './layout';
import './world-map.css';

// ---------------------------------------------------------------------------
// The world, inline. Nothing is loaded, nothing is saved.
// ---------------------------------------------------------------------------

type Seed = { id: string; label: string; kind: Kind; parent?: string; at?: { x: number; y: number } };

const SEED: Seed[] = [
  { id: 'world', label: 'Aetheria', kind: 'world' },

  { id: 'e-sundering', label: 'The Sundering', kind: 'event', parent: 'world' },
  { id: 'o-crown', label: 'The Ember Crown', kind: 'object', parent: 'world' },

  { id: 'e-coronation', label: 'Coronation of Vela', kind: 'event', at: { x: -640, y: -300 } },
  { id: 'e-siege', label: 'Siege of Ravenhold', kind: 'event', at: { x: -640, y: -120 } },
  { id: 'e-winter', label: 'The Long Winter', kind: 'event', at: { x: -640, y: 60 } },
  { id: 'o-ledger', label: 'The Salt Ledger', kind: 'object', at: { x: 620, y: -180 } },
  { id: 'o-ring', label: "Vela's Ring", kind: 'object', at: { x: 620, y: 0 } },
];

const nodeTypes = { circle: CircleNode };

let nextId = 1;

function WorldMapCanvas() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [parents, setParents] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(SEED.map((s) => [s.id, s.parent ?? null])),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const addCount = useRef(0);

  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>(
    useMemo(() => {
      const seeded: MapNode[] = SEED.map((s) => ({
        id: s.id,
        type: 'circle' as const,
        position: s.at ?? { x: 0, y: 0 },
        draggable: s.kind !== 'world',
        style: { width: sizeOf(s.kind === 'world'), height: sizeOf(s.kind === 'world') },
        data: {
          label: s.label,
          kind: s.kind,
          attached: s.kind === 'world' || !!s.parent,
          dropTarget: false,
          editing: false,
          onRename: () => {},
          onEditDone: () => {},
        } as MapNodeData,
      }));
      return applyLayout(seeded, Object.fromEntries(SEED.map((s) => [s.id, s.parent ?? null])));
    }, []),
  );

  // Attached nodes are placed by the map; loose ones keep where they were left.
  function applyLayout(ns: MapNode[], parentMap: Record<string, string | null>): MapNode[] {
    const centres = radialLayout(
      ns.map((n) => ({
        id: n.id,
        parentId: parentMap[n.id] ?? null,
        isWorld: n.data.kind === 'world',
      })),
    );
    return ns.map((n) => {
      const isWorld = n.data.kind === 'world';
      const centre = centres[n.id];
      const attached = isWorld || !!parentMap[n.id];
      return {
        ...n,
        position: centre ? toTopLeft(centre, isWorld) : n.position,
        data: { ...n.data, attached },
      };
    });
  }

  // The `fitView` prop alone does not survive the first paint here — the nodes
  // are not measured yet when it fires, so the map lands at the origin,
  // off-screen. Fit once the nodes have real sizes instead.
  const nodesReady = useNodesInitialized();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (nodesReady && !hasFitted.current) {
      hasFitted.current = true;
      fitView({ padding: 0.22, duration: 0 });
    }
  }, [nodesReady, fitView]);

  const rename = useCallback(
    (id: string, label: string) => {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)));
    },
    [setNodes],
  );
  const stopEditing = useCallback(() => setEditingId(null), []);

  const descendantsOf = useCallback(
    (id: string, parentMap: Record<string, string | null>) => {
      const out = new Set<string>([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const [child, parent] of Object.entries(parentMap)) {
          if (parent && out.has(parent) && !out.has(child)) {
            out.add(child);
            grew = true;
          }
        }
      }
      return out;
    },
    [],
  );

  /** Which card is this one being held over? Nearest overlapping centre wins. */
  const hitTest = useCallback(
    (dragged: MapNode, all: MapNode[]) => {
      const banned = descendantsOf(dragged.id, parents);
      const isWorldDragged = dragged.data.kind === 'world';
      const from = toCentre(dragged.position, isWorldDragged);
      let best: { id: string; d: number } | null = null;

      for (const n of all) {
        if (banned.has(n.id)) continue;
        const isWorld = n.data.kind === 'world';
        const to = toCentre(n.position, isWorld);
        const d = Math.hypot(to.x - from.x, to.y - from.y);
        const reach = (sizeOf(isWorld) / 2 + sizeOf(isWorldDragged) / 2) * 0.85;
        if (d < reach && (!best || d < best.d)) best = { id: n.id, d };
      }
      return best?.id ?? null;
    },
    [descendantsOf, parents],
  );

  const onNodeDrag = useCallback(
    (_: unknown, node: MapNode) => {
      const target = hitTest(node, nodes);
      setNodes((ns) =>
        ns.map((n) =>
          n.data.dropTarget === (n.id === target)
            ? n
            : { ...n, data: { ...n.data, dropTarget: n.id === target } },
        ),
      );
    },
    [hitTest, nodes, setNodes],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: MapNode) => {
      const target = hitTest(node, nodes);
      // Dropped on a card: it belongs to that card now.
      // Dropped on empty canvas: it belongs to nothing, and stays where it fell.
      const nextParents = { ...parents, [node.id]: target };
      setParents(nextParents);
      setNodes((ns) =>
        applyLayout(
          ns.map((n) => (n.data.dropTarget ? { ...n, data: { ...n.data, dropTarget: false } } : n)),
          nextParents,
        ),
      );
    },
    [hitTest, nodes, parents, setNodes],
  );

  const addCard = useCallback(
    (kind: Kind) => {
      const slot = addCount.current++ % 6;
      const at = screenToFlowPosition({ x: 120, y: 180 + slot * 46 });
      const id = `n-${nextId++}`;
      setParents((p) => ({ ...p, [id]: null }));
      setNodes((ns) => [
        ...ns,
        {
          id,
          type: 'circle' as const,
          position: at,
          draggable: true,
          style: { width: sizeOf(false), height: sizeOf(false) },
          data: {
            label: kind === 'event' ? 'New event' : 'New object',
            kind,
            attached: false,
            dropTarget: false,
            editing: false,
            onRename: () => {},
            onEditDone: () => {},
          } as MapNodeData,
        },
      ]);
      setEditingId(id);
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_, node) => setEditingId(node.id), []);

  const edges: Edge[] = useMemo(
    () =>
      Object.entries(parents)
        .filter(([, parent]) => parent)
        .map(([child, parent]) => ({
          id: `${parent}->${child}`,
          source: parent as string,
          target: child,
          type: 'straight',
          style: { stroke: 'rgba(226, 214, 190, 0.32)', strokeWidth: 1.5 },
        })),
    [parents],
  );

  // Handlers and the editing flag are stitched in here so the node data the
  // canvas holds stays plain.
  const renderNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, editing: n.id === editingId, onRename: rename, onEditDone: stopEditing },
      })),
    [nodes, editingId, rename, stopEditing],
  );

  const unplaced = nodes.filter((n) => n.data.kind !== 'world' && !parents[n.id]).length;

  return (
    <ReactFlow
      nodes={renderNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onNodeDoubleClick={onNodeDoubleClick}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.2}
      maxZoom={2}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      proOptions={{ hideAttribution: false }}
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#2b3040" />
      <Controls showInteractive={false} />

      <Panel position="top-left" className="toolbar">
        <div className="toolbar-title">World map</div>
        <div className="toolbar-hint">
          Drag a card onto another to make it belong there. Drop it on empty space to take it
          out again. Double-click to rename.
        </div>
        <div className="toolbar-actions">
          <button onClick={() => addCard('event')}>+ Event</button>
          <button onClick={() => addCard('object')}>+ Object</button>
        </div>
        <div className="toolbar-count">
          {unplaced === 0 ? 'Everything is placed' : `${unplaced} not yet placed`}
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function WorldMap() {
  return (
    // Sized inline as well as in CSS: in dev the stylesheet arrives after the
    // first render, and React Flow refuses to measure anything inside a
    // zero-sized container — the nodes stay `visibility: hidden` for good.
    <div className="world-map-root" style={{ position: 'fixed', inset: 0 }}>
      <ReactFlowProvider>
        <WorldMapCanvas />
      </ReactFlowProvider>
    </div>
  );
}
