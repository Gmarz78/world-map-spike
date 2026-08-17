import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { showsBadges, type Badge, type Kind } from './grouping';
import { badgeAngles, rimPercent } from './layout';

/** Where a card is standing right now, which is not a property of the card. */
export type Role = 'centre' | 'ring' | 'loose';

export type MapNodeData = {
  label: string;
  kind: Kind;
  role: Role;
  isGroup: boolean;
  isAdd: boolean;
  badges: Badge[];
  dropTarget: boolean;
  editing: boolean;
  onRename: (id: string, label: string) => void;
  onEditDone: () => void;
  onOpenBadge: (badgeId: string) => void;
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
  // In the middle, a badge is a whole category and the way into it. Elsewhere
  // it is only a count, small, saying what is inside without being the way in.
  const isWayIn = data.role === 'centre';

  const classes = [
    'circle-node',
    `kind-${data.kind}`,
    `role-${data.role}`,
    data.isGroup ? 'is-group' : '',
    data.isAdd ? 'is-add' : '',
    data.dropTarget ? 'drop-target' : '',
    selected && data.role !== 'centre' ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const angles = badgeAngles(data.badges.length);

  return (
    <div className={classes}>
      <Handle type="target" position={Position.Top} style={hiddenHandle} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} isConnectable={false} />

      <span className="card-face">
        {data.isAdd && <span className="plus">+</span>}

        {data.kind !== 'world' && !data.isGroup && !data.isAdd && (
          <span className="kind-tag">{data.kind}</span>
        )}

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
      </span>

      {showsBadges(data.isGroup, data.role) && data.badges.length > 0 && (
        <span className={isWayIn ? 'badges badges-open' : 'badges'}>
          {data.badges.map((badge, i) => {
            const { left, top } = rimPercent(angles[i]);
            return (
              <span
                key={badge.kind}
                className={`nodrag badge badge-${badge.kind}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                onClick={
                  isWayIn
                    ? (e) => {
                        e.stopPropagation();
                        data.onOpenBadge(badge.id);
                      }
                    : undefined
                }
              >
                {isWayIn && <span className="badge-label">{badge.label}</span>}
                <span className="badge-count">{badge.count}</span>
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}
