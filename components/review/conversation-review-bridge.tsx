"use client";

import { useState } from "react";

export function ConversationReviewBridge({
  runId,
  question,
  findings,
  candidates,
}: {
  runId: string;
  question: string;
  findings: number;
  candidates: number;
}) {
  const [copied, setCopied] = useState(false);

  const brief = [
    "Use @GitHub with dmeehan45/Parent-Behavioral-Health-OS.",
    `Read research run ${runId} and the current canonical records it touches.`,
    `The research question is: ${question}`,
    "Work with me conversationally on the findings and candidate Problems rather than asking me to approve or reject them one by one.",
    "Help me refine the framing, surface what changes my mental model, capture reviewer reflections and follow-up questions, and identify the smallest research-supported Problems or Bets worth carrying forward.",
    "When something from the conversation is worth preserving before it is canonical, write a reflection handoff that reflectsOn this run and carries the refined candidates, context notes, or questions. Do not treat the chat transcript as a source of truth.",
    "Only write a decision file for findings or candidates I explicitly say are ready to authorize for canonical application. Leave everything else undecided rather than forcing a disposition.",
    "Do not change content/ until I explicitly approve the model change.",
  ].join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="shell page" aria-label="Continue review in conversation">
      <div className="review-gate">
        <strong>Work with the research in conversation.</strong> This page is the organized record and authorization surface, not the place where complex ideas have to be finished. Use the conversational engine to refine the run, then let it write back a reflection, questions, or explicit decisions through GitHub.
      </div>
      <div className="review-actions">
        <button type="button" className="button" onClick={copy}>
          {copied ? "Conversation brief copied" : "Copy conversation brief"}
        </button>
        <span className="small muted">
          {findings} finding{findings === 1 ? "" : "s"} · {candidates} proposal{candidates === 1 ? "" : "s"}. Leave items undecided while they still need thinking.
        </span>
      </div>
    </section>
  );
}
