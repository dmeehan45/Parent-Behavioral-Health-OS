"use client";

import { useState } from "react";

/**
 * What it feels like when a new clinician is handed a proposed starting
 * caseload instead of an empty marketplace — next to what it feels like to
 * build the same caseload by hand.
 *
 * The two modes sit side by side because the Bet's learning decision is which
 * of them a clinician actually wants, and a prototype that offered only the
 * assembled one would presume the answer instead of testing it. Switching
 * between them, and abandoning one for the other, is the behaviour worth
 * watching, so it stays available at every point.
 *
 * Entirely synthetic and local. Nothing here is a real family, clinician, or
 * match, and nothing is created, sent, or saved.
 */

const WEEKLY_CAPACITY = 6;

const CLINICIAN = {
  name: "Dr. Maya Chen",
  role: "Child & adolescent therapist",
  capacity: `${WEEKLY_CAPACITY} weekly sessions available`,
  population: "Ages 10–17",
};

type Family = {
  id: string;
  name: string;
  need: string;
  fit: number;
  /** Why this one scored as it did. Shown because a number nobody can
   *  interrogate is not something a clinician can disagree with. */
  because: string;
  context: string;
};

/**
 * More candidates than the clinician has room for, on purpose. A caseload is a
 * choice among more options than fit, which is also what the bet is about.
 */
const FAMILIES: Family[] = [
  { id: "rivera", name: "Rivera family", need: "Age 14 · Anxiety", fit: 94, because: "Age, focus and evening availability all match", context: "Evenings · Weekly · Parent participation" },
  { id: "thompson", name: "Thompson family", need: "Age 11 · Family conflict", fit: 89, because: "Focus matches; after-school rather than evening", context: "After school · Weekly · Caregiver coaching" },
  { id: "patel", name: "Patel family", need: "Age 16 · School anxiety", fit: 85, because: "Age and focus match; biweekly leaves a slot part-used", context: "Evenings · Biweekly · Transition support" },
  { id: "okafor", name: "Okafor family", need: "Age 12 · Anxiety", fit: 82, because: "Focus and availability match; younger than most of the caseload", context: "Evenings · Weekly · Parent participation" },
  { id: "lindqvist", name: "Lindqvist family", need: "Age 15 · Family conflict", fit: 78, because: "Focus matches; sibling sessions are outside stated preferences", context: "After school · Weekly · Sibling sessions" },
  { id: "moreau", name: "Moreau family", need: "Age 10 · Separation anxiety", fit: 74, because: "At the young edge of the stated population", context: "Evenings · Weekly · Caregiver coaching" },
  { id: "haddad", name: "Haddad family", need: "Age 17 · School avoidance", fit: 71, because: "Presentation is outside the stated focus areas", context: "Evenings · Biweekly · Transition support" },
];

/** What the system would propose on its own: the strongest fits, up to capacity. */
const ASSEMBLED = FAMILIES.slice(0, WEEKLY_CAPACITY).map((family) => family.id);

type Mode = "assembled" | "build";
type Outcome = { mode: Mode; edited: boolean; families: string[] };

export function GuidedCaseload() {
  const [mode, setMode] = useState<Mode>("assembled");
  const [selected, setSelected] = useState<string[]>(ASSEMBLED);
  const [outcome, setOutcome] = useState<Outcome>();

  const edited = mode === "assembled" && !sameSet(selected, ASSEMBLED);
  const full = selected.length >= WEEKLY_CAPACITY;

  const switchTo = (next: Mode) => {
    setMode(next);
    // Each mode starts from its own premise: assembled hands over a caseload,
    // building starts from nothing. Carrying a selection across would blur the
    // very difference the session is trying to observe.
    setSelected(next === "assembled" ? ASSEMBLED : []);
    setOutcome(undefined);
  };

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  if (outcome) return <Closing outcome={outcome} onRestart={() => switchTo(outcome.mode)} />;

  return (
    <div className="caseload">
      <section className="clinician-card">
        <span className="eyebrow">New clinician</span>
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

      {/* The choice under test, made switchable rather than assigned. */}
      <div className="mode-switch" role="group" aria-label="How to build this caseload">
        <button
          type="button"
          className={`mode${mode === "assembled" ? " selected" : ""}`}
          aria-pressed={mode === "assembled"}
          onClick={() => switchTo("assembled")}
        >
          <strong>Start from a proposed caseload</strong>
          <span className="small muted">We assemble {WEEKLY_CAPACITY} families. Accept, change, or reject it.</span>
        </button>
        <button
          type="button"
          className={`mode${mode === "build" ? " selected" : ""}`}
          aria-pressed={mode === "build"}
          onClick={() => switchTo("build")}
        >
          <strong>Build it yourself</strong>
          <span className="small muted">The same families, unsorted into a caseload. Choose your own.</span>
        </button>
      </div>

      <section className="panel">
        <span className="eyebrow">{mode === "assembled" ? "Proposed starting caseload" : "Available families"}</span>
        <h2 className="panel-title">
          {mode === "assembled" ? "We put this together for you" : "Choose who to start with"}
        </h2>
        <p className="muted small">
          {mode === "assembled"
            ? "Every family below is already in the proposal. Remove any that are wrong, or add another in their place."
            : "Nothing is selected. Add families up to your weekly capacity."}
        </p>

        {/* The scores are shown, and said to be undecided in the same breath.
            `define-matching-quality` is queued as open research, so presenting
            them as settled would make a session teach the wrong thing. */}
        <p className="provisional" role="note">
          <strong>Fit scores are under development.</strong> They currently weigh stated availability, population and
          focus areas — how match quality should really be judged has not been decided, and these numbers will change.
          Disagree with them freely.
        </p>

        <ul className="family-list">
          {FAMILIES.map((family) => {
            const chosen = selected.includes(family.id);
            const proposedForYou = mode === "assembled" && ASSEMBLED.includes(family.id);
            return (
              <li key={family.id}>
                <button
                  type="button"
                  className={`family${chosen ? " chosen" : ""}`}
                  aria-pressed={chosen}
                  // Full is full: the constraint is the point, so the interface
                  // holds it rather than letting the count run past capacity.
                  disabled={!chosen && full}
                  onClick={() => toggle(family.id)}
                >
                  <span className="family-head">
                    <span>
                      <strong>{family.name}</strong>
                      <br />
                      <span className="small">{family.need}</span>
                    </span>
                    <span className="family-score" title="Provisional fit score">
                      {family.fit}
                    </span>
                  </span>
                  <span className="muted small family-why">{family.because}</span>
                  <span className="muted small">{family.context}</span>
                  <span className="family-state">
                    {chosen
                      ? proposedForYou
                        ? "In your proposed caseload — remove"
                        : "Added ✓ — remove"
                      : full
                        ? "No capacity left"
                        : "Add to caseload"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="capacity">
          <strong>
            {selected.length} of {WEEKLY_CAPACITY} weekly slots filled
          </strong>
          {edited ? <span className="badge-changed">changed from what we proposed</span> : null}

          <div className="capacity-actions">
            <button
              type="button"
              className="button"
              disabled={selected.length === 0}
              onClick={() => setOutcome({ mode, edited, families: selected })}
            >
              {mode === "assembled" && !edited ? "Accept this caseload" : "Propose this caseload"}
            </button>

            {/* Rejection has to be as easy as acceptance, or the prototype
                cannot tell willingness from compliance — which is the whole
                safeguard this experiment is watching for. */}
            {mode === "assembled" ? (
              <button type="button" className="button secondary" onClick={() => switchTo("build")}>
                Reject it and start from scratch
              </button>
            ) : null}
          </div>

          <span className="muted small">
            {selected.length === 0
              ? "Add at least one family to continue."
              : full
                ? "Capacity reached."
                : `Room for ${WEEKLY_CAPACITY - selected.length} more.`}
          </span>
        </div>
      </section>
    </div>
  );
}

/**
 * A genuine end state. It says what would follow in a real system and is
 * explicit that none of it happened, so nobody leaves believing a family was
 * contacted.
 */
function Closing({ outcome, onRestart }: { outcome: Outcome; onRestart: () => void }) {
  const count = outcome.families.length;
  const how =
    outcome.mode === "build"
      ? "You built this caseload yourself."
      : outcome.edited
        ? "You started from our proposal and changed it."
        : "You accepted our proposal as it stood.";

  return (
    <section className="panel closing" role="status">
      <span className="eyebrow">Caseload proposed</span>
      <h2 className="panel-title">
        {count} {count === 1 ? "family" : "families"}, {WEEKLY_CAPACITY - count} {" "}
        {WEEKLY_CAPACITY - count === 1 ? "slot" : "slots"} still open
      </h2>
      <p>{how}</p>
      <p>
        In the system this models, each family would be offered a first appointment and the slots would be held until
        they replied. A family who declined would return to matching, and the slot would reopen.
      </p>
      <p className="muted small">
        Nothing was sent. Nothing was saved. No match was made, and nobody here is a real family or clinician.
      </p>
      <div className="capacity-actions">
        <button type="button" className="button secondary" onClick={onRestart}>
          Start over
        </button>
      </div>
    </section>
  );
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((entry) => b.includes(entry));
}
