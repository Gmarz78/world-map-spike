import { badgesFor, type Items, type Parents } from './grouping';
import { badgeAngles, rimPercent } from './layout';

/**
 * The same world, read as a sequence instead of a hierarchy. Everything that
 * happens in it, one after another, in the order it was written down.
 *
 * Deliberately flat for now: no dates, no lengths, no gaps. Position on the
 * line means "after the one before it" and nothing more.
 */
export function Timeline({
  items,
  parents,
  worldId,
  onOpen,
}: {
  items: Items;
  parents: Parents;
  worldId: string;
  onOpen: (id: string) => void;
}) {
  // Insertion order is the story order — the order they were written down.
  const events = Object.values(items).filter((item) => item.kind === 'event');
  const world = items[worldId];

  return (
    <div className="timeline">
      <header className="timeline-head">
        <h1>{world?.label}</h1>
        <p>
          {events.length === 0
            ? 'Nothing happens here yet'
            : `Everything that happens, in order — ${events.length} so far`}
        </p>
      </header>

      <div className="timeline-scroll">
        <div className="timeline-track">
          {events.length > 0 && <span className="timeline-line" />}

          {events.map((event, i) => {
            const badges = badgesFor(event.id, items, parents);
            const angles = badgeAngles(badges.length);

            return (
              <button className="timeline-stop" key={event.id} onClick={() => onOpen(event.id)}>
                <span className="timeline-ordinal">{i + 1}</span>

                <span className="circle-node kind-event role-ring">
                  <span className="card-face">
                    <span className="kind-tag">event</span>
                    <span className="label">{event.label}</span>
                  </span>

                  {badges.length > 0 && (
                    <span className="badges">
                      {badges.map((badge, b) => {
                        const { left, top } = rimPercent(angles[b]);
                        return (
                          <span
                            key={badge.kind}
                            className={`badge badge-${badge.kind}`}
                            style={{ left: `${left}%`, top: `${top}%` }}
                          >
                            <span className="badge-count">{badge.count}</span>
                          </span>
                        );
                      })}
                    </span>
                  )}
                </span>

                <span className="timeline-of">
                  {parents[event.id] && parents[event.id] !== worldId
                    ? `during ${items[parents[event.id] as string]?.label}`
                    : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
