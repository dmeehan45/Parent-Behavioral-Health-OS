# Signs of AI writing: the pattern catalog

Thirty-four patterns, grouped in six families. Derived from Wikipedia's "Signs
of AI writing" via blader/humanizer and the Hermes port; calibrated for this
repository where noted. LLMs guess the statistically likely next words, and
these patterns are what that tendency leaves behind.

**Read this first.** Several "After" examples below fix vagueness with a
specific — a date, a survey, a named body. That shows the *shape* of the fix.
Whether the move is available is governed by the skill's never-pad rule
(SKILL.md): the specific has to exist in the model or a named source, or the
vague sentence gets cut instead. An invented detail is a blocking finding.

## Content patterns

### 1. Inflated significance and legacy

**Watch for:** stands/serves as, is a testament/reminder, a vital/crucial/
pivotal role/moment, underscores/highlights its importance, reflects broader,
enduring/lasting legacy, setting the stage for, marks a shift, key turning
point, evolving landscape, focal point, indelible mark, deeply rooted

LLM prose puffs arbitrary facts into moments of broader meaning.

> **Before:** The Statistical Institute was established in 1989, marking a
> pivotal moment in the evolution of regional statistics.
>
> **After:** The Statistical Institute was established in 1989 to publish
> regional statistics independently of the national office.

### 2. Notability name-dropping

**Watch for:** independent coverage, leading expert, media outlets listed
without context, follower counts as proof

Claims of importance stacked instead of one concrete, checkable fact.

### 3. Fake depth via participles

**Watch for:** sentences ending in highlighting..., ensuring..., reflecting...,
fostering..., showcasing..., contributing to..., emphasizing...

An "-ing" phrase bolted onto a sentence to simulate analysis. Cut the phrase;
if it said something real, promote it to its own sentence with a subject.

> **Before:** The step validates inputs early, ensuring robustness and
> reflecting a commitment to quality.
>
> **After:** The step validates inputs before the handoff, so a malformed
> record fails here rather than three steps later.

### 4. Promotional language

**Watch for:** boasts, vibrant, rich (figurative), profound, seamless,
groundbreaking, renowned, stunning, nestled, in the heart of, commitment to,
best-in-class (outside a quoted goal), robust (as praise)

Neutral description beats sales copy everywhere in this repository.

### 5. Vague attribution and weasel words

**Watch for:** experts argue, industry reports, observers have noted, some
critics, it is widely believed, studies show

An opinion needs an owner and a claim needs a source. In this repository that
means a named source, a `provenance` entry, or an explicit marker that the
statement is ours and proposed.

### 6. Formulaic "challenges and future outlook" sections

**Watch for:** Despite its..., faces several challenges..., Despite these
challenges..., Future outlook, continues to thrive

The shape is the tell: a paragraph of trouble followed by an unearned
recovery. Name the actual problem — this repository has a primitive for that —
or say nothing.

## Language and grammar patterns

### 7. AI vocabulary

**High-frequency words:** delve, additionally, crucial, pivotal, intricate,
enduring, enhance, fostering, garner, highlight (verb), underscore (verb),
interplay, landscape (abstract), tapestry (abstract), testament, showcase,
vibrant, key (adjective), valuable, align with, emphasizing

**Marketing register, same tell:** at the end of the day, when it comes to,
in a world where, moving forward, deep dive, game-changer, double down, lean
into, unpack, navigate (challenges), circle back, make no mistake

These words cluster in post-2023 text and co-occur. One may be innocent; three
in a paragraph is a pattern.

### 8. Copula avoidance

**Watch for:** serves as, stands as, functions as, represents, boasts,
features, offers

"Is", "are", and "has" are usually the honest verbs.

> **Before:** The projection serves as the single boundary between content and
> interface.
>
> **After:** The projection is the single boundary between content and
> interface.

### 9. Negative parallelism and tailing negations

**Watch for:** not only... but..., it's not just X, it's Y, and clipped
tailing fragments: "no guessing", "no wasted motion"

> **Before:** The map isn't just a diagram; it's a living projection of the
> model. No stale views, no manual refresh.
>
> **After:** The map is a projection of the model, and it re-fetches when the
> content changes, so an open map does not go stale.

Note the difference from the house pattern "the trouble, not the fix" — that
is a contrast doing real semantic work in four words, not a rhetorical
template stretched over a sentence.

### 10. Rule-of-three overuse

Ideas forced into triples for rhythm: "innovation, inspiration, and industry
insights". Real lists have the number of items the subject has.

### 11. Synonym cycling

The same referent renamed each sentence (the protagonist / the main character /
the central figure / the hero) to dodge repetition penalties. In this
repository the same thing keeps the same name — a Step is a Step every time
it appears.

### 12. False ranges

"From X to Y" where X and Y sit on no meaningful scale: "from onboarding to
outcomes, from families to the future of care". Name the actual items.

### 13. Passive voice and subjectless fragments

**Watch for:** "No configuration needed." "The results are preserved
automatically." Rewrite with the actor when it clarifies who does what — which
in system documentation is most of the time.

## Style patterns

### 14. Em dash overuse — calibrated for this repository

Upstream flags em dashes wholesale. Here they are house style: `AGENTS.md` and
`docs/` use them for asides and reversals throughout, and removing them would
move prose *away* from the voice sample. The tell that survives calibration is
mechanical density — several per paragraph, every sentence hinged on one, or
dashes standing where a comma or a period reads more plainly.

### 15. Boldface overuse — calibrated for this repository

House style bolds the rule a paragraph introduces, once, at its head. The tell
is bold scattered mid-sentence as emphasis — **key** phrases **highlighted**
like this — or bolding every term in a list.

### 16. Inline-header vertical lists

Bullets shaped "**Header:** sentence restating the header". Either the
headers are real structure (make them a real list of things with names) or
they are decoration (write prose).

### 17. Title case headings

House headings are sentence case, always. A Title Case Heading is a tell here
with no exceptions to calibrate.

### 18. Emojis

None in this repository's prose or UI copy. The design system says meaning
arrives in words; hue is category, and decoration is neither.

### 19. Curly quotation marks — calibrated for this repository

The paste-from-chatbot fingerprint is curly quotes in *source prose* — a
markdown file that otherwise uses straight quotes suddenly quoting "like
this". The inconsistency is the tell. The interface, by contrast, uses
typographic quotes deliberately — `components/review/finding-card.tsx` wraps
extracts in them, `lib/model/open-ends.ts` composes them around titles — and
a humanizing pass does not "fix" those.

## Communication patterns

### 20. Chatbot correspondence artifacts

**Watch for:** I hope this helps, Certainly!, Of course!, Great question,
here is a..., let me know if..., would you like...

Conversation scaffolding pasted as content. Always a finding.

### 21. Knowledge-cutoff disclaimers

**Watch for:** as of [date] (in the AI-disclaimer sense), based on available
information, while specific details are limited/scarce

If the detail is unknown, this repository has honest forms for that: an empty
field, an open question, a `confidence: low`. The disclaimer is neither.

### 22. Sycophancy

**Watch for:** You're absolutely right, excellent point, great question

Never appears in prose a reader sees.

## Filler and hedging

### 23. Filler phrases

- "In order to achieve this" → "To achieve this"
- "Due to the fact that" → "Because"
- "At this point in time" → "Now"
- "Has the ability to process" → "Can process"
- "It is important to note that the data shows" → "The data shows"

### 24. Excessive hedging

"It could potentially possibly be argued that the change might have some
effect." One hedge, chosen to match the record's actual confidence. See the
skill's rule on calibration: the fix for a hedge is not always removal —
check what the claim's frontmatter asserts first.

### 25. Generic positive conclusions

**Watch for:** the future looks bright, exciting times ahead, a major step in
the right direction, continues its journey toward excellence

End with the last real thing said. Documents here do not need send-offs.

### 26. Hyphenated buzzword chains — calibrated for this repository

Upstream recommends de-hyphenating common pairs. Do not: "high-quality,
data-driven report" de-hyphenated is just wrong grammar wearing a disguise.
The real tell is the *chain* — three or four compound modifiers stacked in one
sentence ("cross-functional, client-facing, data-driven") — which reads as
generated whether or not the hyphens are correct. Unstack the sentence; keep
correct hyphenation on whatever survives.

### 27. Persuasive authority tropes

**Watch for:** the real question is, at its core, what really matters,
fundamentally, the heart of the matter

Ceremony announcing depth the next sentence rarely delivers. State the point.

### 28. Signposting

**Watch for:** let's dive in, let's explore, here's what you need to know,
without further ado, now let's look at

Doing announced instead of done.

### 29. Fragmented headers

A heading, then a one-line paragraph restating the heading, then the content.
Delete the restatement.

## Rhythm and rhetoric

### 30. Forced metaphors

A decorative metaphor, often explained right after itself: "the codebase is a
garden we must tend — in other words, delete unused code." Say the literal
thing. A metaphor earns its place when it compresses, not when it decorates.

### 31. Dramatic fragmentation

**Watch for:** two-word sentences for drama. Staccato runs. "It just works.
Every time." A quotable kicker closing every section.

If a line would fit on a poster, fold it back into a sentence with a subject.

### 32. Rhetorical questions answered immediately

"What makes a projection reliable? It comes down to determinism." The question
adds nothing; the answer was the sentence. (A question that stays open — the
kind a record page ends on deliberately — is a different thing: it is asked
*of the reader* and not answered.)

### 33. Sentence-opener tics

**Watch for:** So..., Look..., habitual And/But openers, Interestingly,
Importantly, Notably, Crucially, Essentially, Ultimately

Adverb openers tell the reader how to feel before saying anything. Start with
the substance.

### 34. Reassurance kickers

**Watch for:** and that's okay, and that's fine, there's nothing wrong with
that, you're not alone

This repository's version of reassurance is structural, stated once where it
is a rule — "Incompleteness is valid" — not sprinkled as comfort.

## Attribution

Patterns 1–29 derive from [blader/humanizer](https://github.com/blader/humanizer)
by Siqi Chen (MIT), built on
[Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
Patterns 30–34 and the marketing-register list in pattern 7 come from the
[Hermes Agent port](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/humanizer).
Calibrations on patterns 5, 6, 9, 11, 14, 15, 18, 19, 21, 24, 26, 32, and 34
are this repository's, made against its house voice and rigor rules. The upstream
MIT license is preserved in [../LICENSE](../LICENSE).
