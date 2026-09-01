# Term suggestions

Technical test — "Suggestions de terme".

Given a term and a list of choices, return the N closest ones.

```bash
npm install
npm start -- suggest "gros" "gros,gras,graisse,agressif,go,ros,gro" 2
npm test
npm run typecheck
```

## Reading the problem

The subject rules out inserting letters: similarity is "le nombre de lettres à
remplacer". So this is **not** an edit distance — Levenshtein would score
`agressif` against `gros` at 4 through insertions, where the subject expects 1.

The rule that reproduces the subject's table exactly is a **sliding window
Hamming distance**: slide the term across the candidate, keep the cheapest
position.

| Candidate  | Windows of length 4                    | Best | Subject |
| ---------- | -------------------------------------- | ---- | ------- |
| `gros`     | `gros` 0                               | 0    | 0       |
| `gras`     | `gras` 1                               | 1    | 1       |
| `graisse`  | `grai` 2, `rais` 3, `aiss` 4, `isse` 4 | 2    | 2       |
| `agressif` | `agre` 4, **`gres` 1**, `ress` 3, …    | 1    | 1       |
| `go`, `ros`, `gro` | shorter than the term          | —    | excluded |

This also collapses the subject's two cases into a single rule. A candidate that
*contains* the term has a window at distance 0, so "contains the term" and
"closest to the term" need no separate code path.

Candidates shorter than the term are **excluded**, not ranked last. The subject
calls them "pas du tout similaire (pas assez de lettres)", which is a different
answer from a large score — hence `getBestDifferenceScore` returns `null` rather
than a number, forcing the caller to decide.

Ranking, from the most to the least discriminating: fewest differences, then
closest in length to the searched term, then alphabetical.

## Complexity

For `n` choices, a term of length `k` and candidates of length `m`: scoring is
`O(n · m · k)`, ranking is `O(n log n)`.

Ranking sorts the full list and slices, where a bounded heap would be
`O(n log N)`. At the size of an autocomplete choice list the constant factors
dominate, and an explicit three-step comparator is worth more than the saved
microseconds. On a list large enough to matter, the scoring pass is the part to
revisit first — an index on the first letters would prune far more than a better
sort.

## Decisions taken

The subject leaves these open; each is covered by a test.

- **Duplicates** are suggested once. A repeated suggestion is useless in an
  autocomplete.
- **Non-alphanumeric choices** are discarded. The subject guarantees an
  alphanumeric list, so this only guards against malformed input.
- **Case and surrounding blanks** are normalised on both sides. Since the subject
  guarantees lowercase input, this is idempotent in practice; a real autocomplete
  would keep the original spelling for display and normalise only for comparison.
- **An invalid suggestion count** is reported, not swallowed. `parseInt` would
  read `"2abc"` as `2`, and `Number` would read `"0x10"` as `16`; unchecked, both
  end in `NaN` and an empty result that looks like a legitimate "no match".
- **A blank term, `N <= 0`, or an empty list** returns an empty list.

## Structure

```
src/
  domain/                    business logic, no I/O
    suggester.ts             ISuggester — the domain's public contract
    scoring.ts               pure scoring functions
    term-suggester.ts        TermSuggester implements ISuggester
  cli/                       adapter, no algorithm
    command.ts               Command
    suggest-command.ts       argv -> domain -> stdout
  index.ts                   composition root and dispatch
```

Each interface sits in the layer that owns it, which keeps the dependency
direction visible: `cli/` imports `domain/`, never the reverse. `SuggestCommand`
receives an `ISuggester` through its constructor, so the algorithm is tested
without the CLI and argument parsing is tested against a spy, without the
algorithm.

## Test cases

`npm test` — 49 cases, colocated with the code they cover.

- `scoring.test.ts` — the subject's table, candidates shorter than the term, a
  candidate literally containing the term (`agrosse`), a best window that is not
  the first one (`xxxxgros`), the equal-length precondition.
- `term-suggester.test.ts` — the subject's example at N=2 and N=3, each ranking
  rule in isolation, N=0, N greater than the list, blank term, empty list,
  duplicates, non-alphanumeric input, and that the caller's list is not mutated.
- `suggest-command.test.ts` — argument parsing and rejected counts, against a
  fake `ISuggester`.

## Toolchain

Node 22, TypeScript in strict mode (plus `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`), ESM, `tsx` to run, Vitest to test.

## Use of AI

Claude was used as a pair-programming partner throughout. Who decided what is the
part worth knowing, so here it is.

**What I designed.** The shape of the solution: two contracts, `ISuggester` for
the suggestion domain and `Command` for the CLI, so the algorithm never depends
on how it is invoked. And the ranking — differences first, then closeness in
length, then alphabetical order — which is the part of the subject that is
easiest to read too quickly.

**What the model found.** The sliding window. I framed the scoring problem and
Claude worked backwards from the `agressif` row of the table to the rule that
explains it: the term has to slide across the candidate, otherwise 1 difference
is impossible. I kept it because the table proves it, not because it was
proposed — and it is the reason `getBestDifferenceScore` exists as its own
function, verifiable against the subject line by line.

**What I cut.** The model proposed a `CommandRegistry` to dispatch commands by
name. I asked whether the whole thing had grown out of proportion for an exercise
the subject describes as "juste une classe ou quelques classes", and that
question is what removed it: an extension point for a second command that will
never exist. The dispatch now lives in the entry point.

**What the tests caught.** Writing the suite before finishing the argument
parsing surfaced `"1e3"` and `"0x10"`, which `Number` reads as 1000 and 16. A
count typed on a command line should be plain digits, so that is what it
validates.

**Tooling calls.** Vitest over the Node test runner, for an ecosystem reason
rather than a technical one. Behaviour-named `describe`/`it` nesting rather than
explicit Given/When/Then comments, which on single-expression tests triple the
line count without adding information. English throughout.
