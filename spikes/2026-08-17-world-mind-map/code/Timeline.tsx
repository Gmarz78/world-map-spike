import { useRef, useState, type Dispatch, type PointerEvent, type SetStateAction } from 'react';
import { appearancesOf, type Items, type Parents } from './grouping';
import {
  SCALES,
  applyDrag,
  assignLanes,
  atPercent,
  axisRange,
  formatPosition,
  formatSpan,
  laneCount,
  pinLanes,
  pinPlace,
  spanOf,
  ticksFor,
  type DragMode,
  type Scale,
  type Span,
} from './axis';

const LANE_HEIGHT = 62;
const LANE_GAP = 14;
const GRIP = 14;

// A pin: a circle, a gap, a stalk, and a dot sitting on the line.
const PIN_CIRCLE = 88;
const PIN_STALK = 26;
const PIN_GAP = 7;
const PIN_RISE = 52;
const pinHeight = (tier: number) => PIN_CIRCLE + PIN_GAP + PIN_STALK + tier * PIN_RISE;

type Drag = {
  id: string;
  mode: DragMode;
  originX: number;
  pxPerUnit: number;
  span: { start: number; end: number };
};

/** Far enough to have meant it, rather than a shaky press. */
const MEANT_IT = 3;

/**
 * The same world, read along its axis — as the whole story, or as the life of
 * one thing in it.
 *
 * Following the world, an event is a rectangle: it has an extent, and where
 * two of them share the axis the rows multiply. Following one object, its
 * appearances are pins on the line in the object's own colour — the question
 * there is *when*, not *how long*, and the thing's name is already overhead.
 */
export function Timeline({
  items,
  setItems,
  parents,
  worldId,
  scale,
  setScale,
  subject,
  setSubject,
  onOpen,
}: {
  items: Items;
  setItems: Dispatch<SetStateAction<Items>>;
  parents: Parents;
  worldId: string;
  scale: Scale;
  setScale: (scale: Scale) => void;
  /** Whose story this is: the world's, or one object's. */
  subject: string;
  setSubject: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<Drag | null>(null);

  // A drag ends with a DOM click on what it ended over, and that click arrives
  // after the pointer has been released — so the drag has already been cleared
  // by the time it is asked about. The answer has to outlive it.
  const didDrag = useRef(false);

  const world = items[worldId];
  const objects = Object.values(items).filter((item) => item.kind === 'object');

  // The whole story, or only the part of it one object is caught up in. Never
  // every object at once: that is a picture nobody can read, and the map
  // already answers "what holds what".
  const following = subject === worldId ? null : items[subject];
  const appearances = following ? new Set(appearancesOf(subject, items, parents)) : null;

  const events = Object.values(items).filter(
    (item) => item.kind === 'event' && (!appearances || appearances.has(item.id)),
  );
  const spans: Span[] = events.map((event) => ({ id: event.id, ...spanOf(event) }));

  // The axis is derived from what is on it, so dragging would otherwise move
  // the ruler you are measuring against. It is held still for the whole drag
  // and lets go on release.
  const frozen = useRef<{ from: number; to: number } | null>(null);
  const live = axisRange(spans);
  const { from, to } = dragging && frozen.current ? frozen.current : live;

  const lanes = assignLanes(spans);
  const rows = laneCount(lanes);
  // Pins collide by their own size on the screen, not by their spans.
  const pins = pinLanes(spans, from, to);
  const unit = SCALES.find((s) => s.id === scale)?.unit ?? 'pages';

  const startDrag = (event: PointerEvent<HTMLElement>, id: string, forced?: DragMode) => {
    const box = event.currentTarget.getBoundingClientRect();
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return;

    const grip = Math.min(GRIP, box.width / 3);
    const mode: DragMode =
      forced ??
      (event.clientX - box.left < grip
        ? 'start'
        : box.right - event.clientX < grip
          ? 'end'
          : 'move');

    frozen.current = { from: live.from, to: live.to };
    didDrag.current = false;
    const next: Drag = {
      id,
      mode,
      originX: event.clientX,
      pxPerUnit: track.width / (live.to - live.from),
      span: spanOf(items[id]),
    };
    drag.current = next;
    setDragging(next);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current) return;

    const travelled = event.clientX - current.originX;
    if (Math.abs(travelled) > MEANT_IT) didDrag.current = true;

    const span = applyDrag(current.span, travelled / current.pxPerUnit, current.mode);
    setItems((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...span } }));
  };

  const endDrag = () => {
    drag.current = null;
    frozen.current = null;
    setDragging(null);
    // The click lands in the same task as the release, so this outlives it by
    // exactly long enough to be asked.
    setTimeout(() => (didDrag.current = false), 0);
  };

  const open = (id: string) => {
    if (!didDrag.current) onOpen(id);
  };

  const ticks = ticksFor(from, to).map((value) => (
    <span className="axis-tick" key={value} style={{ left: `${atPercent(value, from, to)}%` }}>
      <span className="axis-rule" />
      <span className="axis-label">{formatPosition(value, scale)}</span>
    </span>
  ));

  return (
    <div className={dragging ? 'timeline is-dragging' : 'timeline'}>
      <header className="timeline-head">
        <h1>{following ? following.label : world?.label}</h1>
        <p>
          {events.length === 0
            ? following
              ? `${following.label} never touches the story`
              : 'Nothing happens here yet'
            : following
              ? `Where it touches the story — ${events.length} ${
                  events.length === 1 ? 'time' : 'times'
                }, measured in ${unit}`
              : `Everything that happens, in order — ${events.length} across ${rows} ${
                  rows === 1 ? 'lane' : 'lanes'
                }, measured in ${unit}`}
        </p>

        <div className="timeline-controls">
          <label className="subject-select">
            <span>Following</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value={worldId}>Everything in {world?.label}</option>
              {objects.map((object) => (
                <option key={object.id} value={object.id}>
                  {object.label}
                </option>
              ))}
            </select>
          </label>

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
        </div>
      </header>

      <div className="timeline-body" ref={trackRef}>
        {following ? (
          (() => {
            const placed = events.map((event) => {
              const span = spanOf(event);
              const lane = pins.get(event.id) ?? 0;
              return { event, span, ...pinPlace(lane) };
            });

            const tallest = (side: 'above' | 'below') => {
              const tiers = placed.filter((p) => p.side === side).map((p) => p.tier);
              return tiers.length ? pinHeight(Math.max(...tiers)) : 0;
            };

            const pin = (p: (typeof placed)[number]) => (
              <div
                className={`pin-anchor ${p.side}`}
                key={p.event.id}
                style={{
                  left: `${atPercent((p.span.start + p.span.end) / 2, from, to)}%`,
                  height: pinHeight(p.tier),
                }}
              >
                <button
                  className={`circle-node kind-object role-ring pin-card${
                    dragging?.id === p.event.id ? ' held' : ''
                  }`}
                  title={`${p.event.label}${
                    parents[p.event.id] === subject ? ' — its own history' : ' — it appears here'
                  }`}
                  onPointerDown={(e) => startDrag(e, p.event.id, 'move')}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onClick={() => open(p.event.id)}
                >
                  <span className="card-face">
                    <span className="label">{formatSpan(p.span.start, p.span.end, scale)}</span>
                  </span>
                </button>

                {/* Kept a few pixels clear of the circle, reaching down to the
                    line and touching it with a dot. */}
                <span className="pin-stalk" />
                <span className="pin-dot" />
              </div>
            );

            return (
              <>
                <div className="pin-field" style={{ height: tallest('above') }}>
                  {placed.filter((p) => p.side === 'above').map(pin)}
                </div>

                <div className="axis-line" />

                <div className="pin-field" style={{ height: tallest('below') }}>
                  {placed.filter((p) => p.side === 'below').map(pin)}
                </div>

                <div className="axis axis-under">{ticks}</div>
              </>
            );
          })()
        ) : (
          <>
            <div className="axis">{ticks}</div>

            <div
              className="lanes"
              style={{ height: Math.max(rows, 1) * (LANE_HEIGHT + LANE_GAP) }}
            >
              {events.map((event) => {
                const span = spanOf(event);
                const lane = lanes.get(event.id) ?? 0;
                const during = parents[event.id] !== worldId ? parents[event.id] : null;

                return (
                  <div
                    className={`bar kind-event${dragging?.id === event.id ? ' held' : ''}`}
                    key={event.id}
                    role="button"
                    tabIndex={0}
                    onPointerDown={(e) => startDrag(e, event.id)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onClick={() => open(event.id)}
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
                        {formatSpan(span.start, span.end, scale)}
                        {during && items[during] ? ` · during ${items[during].label}` : ''}
                      </span>
                    </span>

                    {/* Somewhere to take hold of each end. */}
                    <span className="grip grip-start" />
                    <span className="grip grip-end" />
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="timeline-hint">
          {following
            ? 'Drag a pin to move that moment along the story. Click one to open it on the map.'
            : 'Drag a bar to move it along the story, or take hold of either end to change where it starts or stops. Click one to open it on the map.'}
        </p>
      </div>
    </div>
  );
}
