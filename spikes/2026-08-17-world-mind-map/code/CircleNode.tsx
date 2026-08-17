import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export type Kind = 'world' | 'event' | 'object';

export type MapNodeData = {
  label: string;
  kind: Kind;
  attached: boolean;
  dropTarget: boolean;
  editing: boolean;
  onRename: (id: string, label: string) => void;
  onEditDone: () => void;
  [key: string]: unknown;
};

export type MapNode = Node<MapNodeData, 'circle'>;

// Edges leave from the middle of a circle, so both handles sit at the centre
// and are invisible. Connecting by handle is off entirely — the only way to
// make a relationship here is to drop one card onto another.
const hiddenHandle = {
  left: '50%',
  top: '50%',
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 'none',
  background: 'transparent',
  opacity: 0,
  pointerEvents: 'none' as const,
};

export function CircleNode({ id, data, selected }: NodeProps<MapNode>) {
  const classes = [
    'circle-node',
    `kind-${data.kind}`,
    data.attached ? 'attached' : 'loose',
    data.dropTarget ? 'drop-target' : '',
    selected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Top} style={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} isConnectable={false} />

      {data.kind !== 'world' && <span className="kind-tag">{data.kind}</span>}

      {data.editing ? (
        <input
          className="nodrag label-input"
          autoFocus
          defaultValue={data.label}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => {
            data.onRename(id, e.currentTarget.value.trim() || data.label);
            data.onEditDone();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              e.currentTarget.value = data.label;
              e.currentTarget.blur();
            }
          }}
        />
      ) : (
        <span className="label">{data.label}</span>
      )}
    </div>
  );
}
