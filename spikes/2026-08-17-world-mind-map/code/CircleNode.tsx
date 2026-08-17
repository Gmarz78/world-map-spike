import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { Badge, Kind } from './grouping';
import { rimPercent } from './layout';

/** Where a card is standing right now, which is not a property of the card. */
export type Role = 'centre' | 'ring' | 'loose';

export type MapNodeData = {
  label: string;
  subtitle: string;
  kind: Kind;
  role: Role;
  isAdd: boolean;
  badges: Badge[];
  /** Where each badge sits on the rim, decided by the layout, not the card. */
  badgeAt: number[];
  open: string[];
  dropTarget: boolean;
  editing: boolean;
  onRename: (id: string, label: string) => void;
  onEditDone: () => void;
  onToggleBranch: (categoryId: string) => void;
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
  // In the middle a badge is large enough to carry the category's name. Out on
  // a branch it is small and carries only the count — but both open.
  const roomForName = data.role === 'centre';

  const classes = [
    'circle-node',
    `kind-${data.kind}`,
    `role-${data.role}`,
    data.isAdd ? 'is-add' : '',
    data.dropTarget ? 'drop-target' : '',
    selected && data.role !== 'centre' ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Top} style={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} isConnectable={false} />

      <span className="card-face">
        {data.isAdd && !data.editing && <span className="plus">+</span>}

        {data.kind !== 'world' && !data.isAdd && !roomForName && (
          <span className="kind-tag">{data.kind}</span>
        )}

        {data.editing ? (
          // A draft on the empty slot starts blank and commits nothing when it
          // is left blank — the card does not exist until it has a name.
          <input
            className="nodrag label-input"
            autoFocus
            placeholder={data.isAdd ? `Name the ${data.kind}` : undefined}
            defaultValue={data.isAdd ? '' : data.label}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              const typed = e.currentTarget.value.trim();
              data.onRename(id, data.isAdd ? typed : typed || data.label);
              data.onEditDone();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                e.currentTarget.value = data.isAdd ? '' : data.label;
                e.currentTarget.blur();
              }
            }}
          />
        ) : (
          <span className="label">{data.label}</span>
        )}

        {roomForName && data.subtitle && <span className="subtitle">{data.subtitle}</span>}
      </span>

      {/* Each badge is a category, and the place its branch grows from. */}
      {data.badges.length > 0 && (
        <span className={roomForName ? 'badges badges-open' : 'badges'}>
          {data.badges.map((badge, i) => {
            const { left, top } = rimPercent(data.badgeAt[i] ?? 0);
            const isOpen = data.open.includes(badge.id);

            return (
              <span
                key={badge.kind}
                className={`nodrag badge badge-${badge.kind}${isOpen ? ' is-open' : ''}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                title={isOpen ? `Close ${badge.label}` : `Open ${badge.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onToggleBranch(badge.id);
                }}
              >
                {roomForName && <span className="badge-label">{badge.label}</span>}
                <span className="badge-count">{badge.count}</span>
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}
