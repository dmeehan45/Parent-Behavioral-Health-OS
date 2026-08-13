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

const SUGGESTED_FAMILIES = [
  { id: "rivera", name: "Rivera family", need: "Age 14 · Anxiety", fit: 94, context: "Evenings · Weekly · Parent participation" },
  { id: "thompson", name: "Thompson family", need: "Age 11 · Family conflict", fit: 89, context: "After school · Weekly · Caregiver coaching" },
  { id: "patel", name: "Patel family", need: "Age 16 · School anxiety", fit: 85, context: "Evenings · Biweekly · Transition support" },
];

export function GuidedCaseload() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  return (
    <div className="prototype-grid">
      <section className="clinician-card">
        <span className="eyebrow" style={{ color: "#a7d9c5" }}>
          New clinician
        </span>
        <h3>{CLINICIAN.name}</h3>
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
                <button type="button" className="family" aria-pressed={chosen} onClick={() => toggle(family.id)}>
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
          <p className="muted small">
            This interaction tests whether active guidance makes the path to an initial caseload more legible than an
            empty marketplace does.
          </p>
        </div>
      </section>
    </div>
  );
}
