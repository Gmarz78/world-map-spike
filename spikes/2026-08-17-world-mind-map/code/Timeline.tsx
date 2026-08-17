import { useRef, useState, type Dispatch, type PointerEvent, type SetStateAction } from 'react';
import { badgesFor, type Items, type Parents } from './grouping';
import {
  SCALES,
  applyDrag,
  assignLanes,
  atPercent,
  axisRange,
  formatPosition,
  laneCount,
  spanOf,
  ticksFor,
  type DragMode,
  type Scale,
  type Span,
} from './axis';

const LANE_HEIGHT = 62;
const LANE_GAP = 14;
const GRIP = 14;

type Drag = {
  id: string;
  mode: DragMode;
  originX: number;
  pxPerUnit: number;
  span: { start: number; end: number };
  moved: boolean;
};

/**
 * The same world, read along its axis.
 *
 * An event is a rectangle here rather than a circle, because on this view it
 * has an extent: it starts somewhere and ends somewhere. Where two of them
 * share any of the axis they cannot share a row, so the rows multiply.
 */
export function Timeline({
  items,
  setItems,
  parents,
  worldId,
  scale,
  setScale,
  onOpen,
}: {
  items: Items;
  setItems: Dispatch<SetStateAction<Items>>;
  parents: Parents;
  worldId: string;
  scale: Scale;
  setScale: (scale: Scale) => void;
  onOpen: (id: string) => void;
}) {
  const lanesRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<Drag | null>(null);

  const world = items[worldId];
  const events = Object.values(items).filter((item) => item.kind === 'event');
  const spans: Span[] = events.map((event) => ({ id: event.id, ...spanOf(event) }));

  // The axis is derived from what is on it, so dragging would otherwise move
  // the ruler you are measuring against. It is held still for the whole drag
  // and lets go on release.
  const frozen = useRef<{ from: number; to: number } | null>(null);
  const live = axisRange(spans);
  const { from, to } = dragging && frozen.current ? frozen.current : live;

  const lanes = assignLanes(spans);
  const rows = laneCount(lanes);
  const unit = SCALES.find((s) => s.id === scale)?.unit ?? 'pages';

  const startDrag = (event: PointerEvent<HTMLElement>, id: string) => {
    const bar = event.currentTarget.getBoundingClientRect();
    const track = lanesRef.current?.getBoundingClientRect();
    if (!track) return;

    const grip = Math.min(GRIP, bar.width / 3);
    const atLeftEdge = event.clientX - bar.left < grip;
    const atRightEdge = bar.right - event.clientX < grip;
    const mode: DragMode = atLeftEdge ? 'start' : atRightEdge ? 'end' : 'move';

    frozen.current = { from: live.from, to: live.to };
    const next: Drag = {
      id,
      mode,
      originX: event.clientX,
      pxPerUnit: track.width / (live.to - live.from),
      span: spanOf(items[id]),
      moved: false,
    };
    drag.current = next;
    setDragging(next);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;

    const deltaUnits = (event.clientX - current.originX) / current.pxPerUnit;
    if (Math.abs(event.clientX - current.originX) > 3) current.moved = true;

    const span = applyDrag(current.span, deltaUnits, current.mode);
    setItems((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...span } }));
  };

  const endDrag = () => {
    drag.current = null;
    frozen.current = null;
    setDragging(null);
  };

  return (
    <div className={dragging ? 'timeline is-dragging' : 'timeline'}>
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

        <div
          className="lanes"
          ref={lanesRef}
          style={{ height: Math.max(rows, 1) * (LANE_HEIGHT + LANE_GAP) }}
        >
          {events.map((event) => {
            const span = spanOf(event);
            const lane = lanes.get(event.id) ?? 0;
            const badges = badgesFor(event.id, items, parents);
            const during = parents[event.id] !== worldId ? parents[event.id] : null;
            const held = dragging?.id === event.id;

            return (
              <div
                className={held ? 'bar kind-event held' : 'bar kind-event'}
                key={event.id}
                role="button"
                tabIndex={0}
                onPointerDown={(e) => startDrag(e, event.id)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClick={() => {
                  // A drag that ends on the bar also fires a click; only a
                  // press that never moved means "open this".
                  if (!dragging && !drag.current) onOpen(event.id);
                }}
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

                {/* Somewhere to take hold of each end. */}
                <span className="grip grip-start" />
                <span className="grip grip-end" />

                {badges.length > 0 && (
                  <span className="bar-badges">
                    {badges.map((badge) => (
                      <span key={badge.kind} className={`badge badge-${badge.kind}`}>
                        <span className="badge-count">{badge.count}</span>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="timeline-hint">
          Drag a bar to move it along the story, or take hold of either end to
          change where it starts or stops. Click one to open it on the map.
        </p>
      </div>
    </div>
  );
}
