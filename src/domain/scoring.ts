/**
 * Pure scoring helpers: no state, no side effects, testable in isolation.
 */

/**
 * Number of letters to replace to turn `src` into `dest`.
 *
 * Mirrors the helper offered by the subject, `GetDifferenceScore(dest, src)`,
 * which is defined on two strings of equal length.
 */
export function getDifferenceScore(dest: string, src: string): number {
    if (dest.length !== src.length) {
        throw new Error(
            `getDifferenceScore expects two strings of the same length, got ${dest.length} and ${src.length}.`,
        );
    }

    let diff = 0;
    for (let i = 0; i < dest.length; i++) {
        if (dest[i] !== src[i]) diff++;
    }
    return diff;
}

/**
 * Difference score of the best position at which `term` can sit inside `candidate`.
 *
 * The subject only allows replacing letters, never inserting them, so the term is
 * slid over the candidate and the cheapest window wins. This is what makes
 * 'agressif' score 1 against 'gros' (window 'gres') rather than 4, and it collapses
 * the two cases of the subject into one rule: a candidate that literally contains
 * the term simply has a window at distance 0.
 *
 * Returns `null` when the candidate is shorter than the term. Such a candidate is
 * "pas du tout similaire (pas assez de lettres)", which is a different answer from
 * a large score, and callers must exclude it rather than rank it last.
 */
export function getBestDifferenceScore(term: string, candidate: string): number | null {
    if (term.length === 0 || candidate.length < term.length) return null;

    let best = Number.POSITIVE_INFINITY;
    const lastStart = candidate.length - term.length;

    for (let start = 0; start <= lastStart; start++) {
        const score = getDifferenceScore(term, candidate.slice(start, start + term.length));
        if (score === 0) return 0;
        if (score < best) best = score;
    }

    return best;
}

/** The subject guarantees alphanumeric choices; anything else is discarded. */
export function isAlphaNumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
}
