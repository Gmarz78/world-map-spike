import { badgesFor, type Items, type Parents } from './grouping';
import {
  SCALES,
  assignLanes,
  atPercent,
  axisRange,
  formatPosition,
  laneCount,
  spanOf,
  ticksFor,
  type Scale,
  type Span,
} from './axis';

const LANE_HEIGHT = 62;
const LANE_GAP = 14;

/**
 * The same world, read as a sequence instead of a hierarchy.
 *
 * An event is a rectangle rather than a circle here, because on this view it
 * has an extent: it starts somewhere and ends somewhere. Where two of them
 * share any of the axis they cannot share a row, so the rows multiply.
 */
export function Timeline({
  items,
  parents,
  worldId,
  scale,
  setScale,
  onOpen,
}: {
  items: Items;
  parents: Parents;
  worldId: string;
  scale: Scale;
  setScale: (scale: Scale) => void;
  onOpen: (id: string) => void;
}) {
  const world = items[worldId];
  const events = Object.values(items).filter((item) => item.kind === 'event');
  const spans: Span[] = events.map((event) => ({ id: event.id, ...spanOf(event) }));

  const { from, to } = axisRange(spans);
  const lanes = assignLanes(spans);
  const rows = laneCount(lanes);
  const unit = SCALES.find((s) => s.id === scale)?.unit ?? 'pages';

  return (
    <div className="timeline">
      <header className="timeline-head">
        <h1>{world?.label}</h1>
        <p>
          {events.length === 0
            ? 'Nothing happens here yet'
            : `Everything that happens, in order — ${events.length} across ${rows} ${
                rows === 1 ? 'lane' : 'lanes'
              }, measured in ${unit}`}
        </p>

        <div className="scale-switch">
          {SCALES.map((option) => (
            <button
              key={option.id}
              className={option.id === scale ? 'on' : ''}
              onClick={() => setScale(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="timeline-body">
        <div className="axis">
          {ticksFor(from, to).map((value) => (
            <span
              className="axis-tick"
              key={value}
              style={{ left: `${atPercent(value, from, to)}%` }}
            >
              <span className="axis-rule" />
              <span className="axis-label">{formatPosition(value, scale)}</span>
            </span>
          ))}
        </div>

        <div className="lanes" style={{ height: Math.max(rows, 1) * (LANE_HEIGHT + LANE_GAP) }}>
          {events.map((event) => {
            const span = spanOf(event);
            const lane = lanes.get(event.id) ?? 0;
            const badges = badgesFor(event.id, items, parents);
            const during = parents[event.id] !== worldId ? parents[event.id] : null;

            return (
              <button
                className="bar kind-event"
                key={event.id}
                onClick={() => onOpen(event.id)}
                style={{
                  left: `${atPercent(span.start, from, to)}%`,
                  width: `${atPercent(span.end, from, to) - atPercent(span.start, from, to)}%`,
                  top: lane * (LANE_HEIGHT + LANE_GAP),
                  height: LANE_HEIGHT,
                }}
              >
                <span className="bar-face">
                  <span className="bar-label">{event.label}</span>
                  <span className="bar-when">
                    {formatPosition(span.start, scale)}
                    {span.end > span.start ? ` – ${formatPosition(span.end, scale)}` : ''}
                    {during && items[during] ? ` · during ${items[during].label}` : ''}
                  </span>
                </span>

                {badges.length > 0 && (
                  <span className="bar-badges">
                    {badges.map((badge) => (
                      <span key={badge.kind} className={`badge badge-${badge.kind}`}>
                        <span className="badge-count">{badge.count}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
