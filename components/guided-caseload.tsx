"use client";

import { useState } from "react";

/**
 * A deliberately small interaction that makes one bet concrete: what it feels
 * like when a new clinician is handed a proposed starting caseload instead of
 * an empty marketplace.
 *
 * Entirely synthetic and local. Nothing here is a real family, clinician, or
 * match, and selecting a card creates nothing.
 */

const WEEKLY_CAPACITY = 6;

const CLINICIAN = {
  name: "Dr. Maya Chen",
  role: "Child & adolescent therapist",
  capacity: `${WEEKLY_CAPACITY} weekly sessions available`,
  population: "Ages 10–17",
  preferences: ["Anxiety", "Family conflict", "Evenings", "Parent participation"],
};

/**
 * More candidates than the clinician has room for, on purpose.
 *
 * The counter underneath measures selections against capacity, so offering
 * fewer families than slots made the stated goal unreachable — the reader could
 * only ever get to three of six, and read that as having done it wrong. A
 * caseload is a choice among more options than fit, which is also the thing the
 * bet is actually about.
 */
const SUGGESTED_FAMILIES = [
  { id: "rivera", name: "Rivera family", need: "Age 14 · Anxiety", fit: 94, context: "Evenings · Weekly · Parent participation" },
  { id: "thompson", name: "Thompson family", need: "Age 11 · Family conflict", fit: 89, context: "After school · Weekly · Caregiver coaching" },
  { id: "patel", name: "Patel family", need: "Age 16 · School anxiety", fit: 85, context: "Evenings · Biweekly · Transition support" },
  { id: "okafor", name: "Okafor family", need: "Age 12 · Anxiety", fit: 82, context: "Evenings · Weekly · Parent participation" },
  { id: "lindqvist", name: "Lindqvist family", need: "Age 15 · Family conflict", fit: 78, context: "After school · Weekly · Sibling sessions" },
  { id: "moreau", name: "Moreau family", need: "Age 10 · Separation anxiety", fit: 74, context: "Evenings · Weekly · Caregiver coaching" },
  { id: "haddad", name: "Haddad family", need: "Age 17 · School avoidance", fit: 71, context: "Evenings · Biweekly · Transition support" },
];

export function GuidedCaseload() {
  const [selected, setSelected] = useState<string[]>([]);
  const [proposed, setProposed] = useState(false);

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  const full = selected.length >= WEEKLY_CAPACITY;

  return (
    <div className="prototype-grid">
      <section className="clinician-card">
        <span className="eyebrow">New clinician</span>
        {/* An h2, like the panel beside it. As an h3 before the following h2 it
            put the page's outline out of order for anyone navigating by it. */}
        <h2>{CLINICIAN.name}</h2>
        <p>{CLINICIAN.role}</p>
        <div className="clinician-facts">
          <div>
            <strong>{WEEKLY_CAPACITY}</strong>
            <span>{CLINICIAN.capacity}</span>
          </div>
          <div>
            <strong>{CLINICIAN.population}</strong>
            <span>preferred population</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <span className="eyebrow">Suggested starting caseload</span>
        <h2 style={{ margin: "10px 0 8px" }}>Review the strongest fits</h2>
        <p className="muted small">
          Synthetic suggestions combining stated fit, availability, and capacity. Selecting a card does not create a
          real match.
        </p>

        <ul className="family-list">
          {SUGGESTED_FAMILIES.map((family) => {
            const chosen = selected.includes(family.id);
            return (
              <li key={family.id}>
                <button
                  type="button"
                  className="family"
                  aria-pressed={chosen}
                  // Full is full: the constraint is the point, so the interface
                  // holds it rather than letting the counter run past capacity.
                  disabled={!chosen && full}
                  onClick={() => toggle(family.id)}
                >
                  <span className="family-head">
                    <span>
                      <strong>{family.name}</strong>
                      <br />
                      <span className="small">{family.need}</span>
                    </span>
                    <span className="family-score">{family.fit}</span>
                  </span>
                  <span className="muted small" style={{ display: "block", marginTop: 6 }}>
                    {family.context}
                  </span>
                  <span className="family-state">{chosen ? "Selected for review ✓" : "Select for review"}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="capacity">
          <strong>
            {selected.length} of {WEEKLY_CAPACITY} weekly slots proposed
          </strong>

          {/* Somewhere to land. The interaction used to stop at the counter, so
              a reader who had chosen a caseload was left holding it with nothing
              to do and no idea what the bet claims happens next. This says what
              would follow without pretending to have done any of it. */}
          {proposed ? (
            <div className="capacity-done" role="status">
              <p>
                <strong>Caseload proposed.</strong> In the system this models, these {selected.length}{" "}
                {selected.length === 1 ? "family" : "families"} would be sent an offer of a first appointment, and the
                clinician would hold the slots until they reply.
              </p>
              <p className="muted small">Nothing was sent. Nothing was saved. Nothing here is a real family.</p>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setProposed(false);
                  setSelected([]);
                }}
              >
                Start over
              </button>
            </div>
          ) : (
            <div className="capacity-actions">
              <button
                type="button"
                className="button"
                disabled={selected.length === 0}
                onClick={() => setProposed(true)}
              >
                Propose this caseload
              </button>
              <span className="muted small">
                {selected.length === 0
                  ? "Choose at least one family to propose."
                  : full
                    ? "Capacity reached."
                    : `Room for ${WEEKLY_CAPACITY - selected.length} more.`}
              </span>
            </div>
          )}

          <p className="muted small">
            This interaction tests whether active guidance makes the path to an initial caseload more legible than an
            empty marketplace does.
          </p>
        </div>
      </section>
    </div>
  );
}
