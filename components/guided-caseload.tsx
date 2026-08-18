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
 * The caseload is the centre of the screen. Capacity used to be a sentence
 * under a list — "3 of 6 weekly slots filled" — which is the constraint the
 * whole experiment is about, written where it could be skipped. It is now the
 * thing being built: six slots, filling as families are added, with the empty
 * ones visible. That is the Bet's `# Fidelity` asking for a limit you can see.
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
  /** Which candidate has its reasoning open. One at a time: the list is for
   *  scanning, and the "why" is what you ask of one row at a time. */
  const [explain, setExplain] = useState<string>();

  const edited = mode === "assembled" && !sameSet(selected, ASSEMBLED);
  const full = selected.length >= WEEKLY_CAPACITY;
  const byId = (id: string) => FAMILIES.find((family) => family.id === id)!;

  const switchTo = (next: Mode) => {
    setMode(next);
    // Each mode starts from its own premise: assembled hands over a caseload,
    // building starts from nothing. Carrying a selection across would blur the
    // very difference the session is trying to observe.
    setSelected(next === "assembled" ? ASSEMBLED : []);
    setOutcome(undefined);
    setExplain(undefined);
  };

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  if (outcome) return <Closing outcome={outcome} onRestart={() => switchTo(outcome.mode)} />;

  /** Every slot the week has, filled or not. The empty ones are the point. */
  const slots = Array.from({ length: WEEKLY_CAPACITY }, (_, index) => selected[index]);

  return (
    <div className="caseload">
      <section className="clinician-card">
        <div>
          <span className="eyebrow">New clinician</span>
          <h2>{CLINICIAN.name}</h2>
          <p>{CLINICIAN.role}</p>
        </div>
        <dl className="clinician-facts">
          <div>
            <dt>Weekly capacity</dt>
            <dd>{CLINICIAN.capacity}</dd>
          </div>
          <div>
            <dt>Preferred population</dt>
            <dd>{CLINICIAN.population}</dd>
          </div>
        </dl>
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

      {/*
        The caseload itself, and the limit around it.

        Six slots, always all six, so the room left is as visible as the room
        taken. Removing is done here rather than back in the list, because this
        is where a clinician is looking at what they have got.
      */}
      <section className="tray" aria-label="Your caseload">
        <div className="tray-head">
          <h2 className="panel-title">Your week</h2>
          <p className="tray-count">
            <strong>{selected.length}</strong> of {WEEKLY_CAPACITY} slots
            {edited ? <span className="badge-changed">changed from what we proposed</span> : null}
          </p>
        </div>

        <ol className="slots">
          {slots.map((id, index) => {
            const family = id ? byId(id) : undefined;
            return (
              <li key={index} className={`slot${family ? " filled" : ""}`}>
                {family ? (
                  <button type="button" className="slot-family" onClick={() => toggle(family.id)}>
                    <span className="slot-name">{family.name}</span>
                    <span className="slot-need">{family.need}</span>
                    <span className="slot-remove" aria-hidden="true">
                      Remove
                    </span>
                    <span className="visually-hidden">Remove {family.name} from your caseload</span>
                  </button>
                ) : (
                  <span className="slot-empty">
                    <span aria-hidden="true">Open</span>
                    <span className="visually-hidden">Slot {index + 1}, open</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="tray-actions">
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
      </section>

      <section className="panel" aria-label="Families waiting to be matched">
        <div className="panel-head">
          <h2 className="panel-title">
            {mode === "assembled" ? "Families we picked, and the rest" : "Families waiting"}
          </h2>
          {/* The caveat sits with the numbers it is about rather than in a
              banner over the whole screen. `define-matching-quality` is queued
              as open research, and the Bet's `# Restraint` says polish must not
              make these look decided. */}
          <p className="provisional">
            Fit is provisional — it weighs stated availability, population and focus only, and how match quality should
            be judged is undecided. Disagree with it freely.
          </p>
        </div>

        <ul className="family-list">
          {FAMILIES.map((family) => {
            const chosen = selected.includes(family.id);
            const open = explain === family.id;
            return (
              <li key={family.id} className={chosen ? "chosen" : undefined}>
                {/* One line to scan: who, what they need, how it scored, and
                    the one action. The reasoning is a second click, on the row
                    a clinician is actually questioning. */}
                <div className="family-row">
                  <span className="family-id">
                    <strong>{family.name}</strong>
                    <span className="family-need">{family.need}</span>
                  </span>

                  <button
                    type="button"
                    className="family-fit"
                    aria-expanded={open}
                    onClick={() => setExplain(open ? undefined : family.id)}
                  >
                    <span className="fit-value">{family.fit}</span>
                    <span className="fit-label">fit, provisional</span>
                    <span className="visually-hidden">— why this score?</span>
                  </button>

                  {/* Removing belongs to the tray, where the caseload is.
                      Two "Remove" controls for one family — one here, one in
                      the week above — read as two different actions. This row
                      says where the family already is, and still removes, so
                      nothing is lost by not going up. */}
                  <button
                    type="button"
                    className={`family-act${chosen ? " chosen" : ""}`}
                    // Full is full: the constraint is the point, so the
                    // interface holds it rather than letting the count run
                    // past capacity.
                    disabled={!chosen && full}
                    onClick={() => toggle(family.id)}
                  >
                    {chosen ? "In your week" : full ? "No room" : "Add"}
                    <span className="visually-hidden">
                      {chosen ? ` — remove ${family.name}` : ` ${family.name}`}
                    </span>
                  </button>
                </div>

                {open ? (
                  <p className="family-why">
                    {family.because}. <span className="muted">{family.context}</span>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
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
        {count} {count === 1 ? "family" : "families"}, {WEEKLY_CAPACITY - count}{" "}
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
      <div className="tray-actions">
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
