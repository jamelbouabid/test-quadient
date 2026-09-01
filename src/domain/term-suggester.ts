import type { ISuggester } from "./suggester.js";
import { getBestDifferenceScore, isAlphaNumeric } from "./scoring.js";

/**
 * A scored candidate. Implementation detail of the ranking: the domain exposes
 * `string[]`, never this intermediate shape.
 */
interface ScoredTerm {
    word: string;
    diff: number;
    lengthGap: number;
}

export class TermSuggester implements ISuggester {
    getSuggestions(term: string, choices: string[], numberOfSuggestions: number): string[] {
        const normalisedTerm = term.trim().toLowerCase();
        if (!normalisedTerm || numberOfSuggestions <= 0) return [];

        return this._rankChoices(choices, normalisedTerm)
            .slice(0, numberOfSuggestions)
            .map(scored => scored.word);
    }

    /**
     * Scores every eligible choice, then applies the ranking the subject defines,
     * from the most to the least discriminating:
     *   1. fewest differences;
     *   2. length closest to the searched term;
     *   3. alphabetical order.
     *
     * Sorting the whole list is O(n log n) where a bounded heap would be O(n log k).
     * At the size of an autocomplete choice list the constant factors dominate, and
     * the explicit three-step comparator is worth more than the saved microseconds.
     */
    private _rankChoices(choices: string[], term: string): ScoredTerm[] {
        const scored: ScoredTerm[] = [];
        const seen = new Set<string>();

        for (const choice of choices) {
            const word = choice.trim().toLowerCase();
            if (!isAlphaNumeric(word) || seen.has(word)) continue;
            seen.add(word);

            const diff = getBestDifferenceScore(term, word);
            if (diff === null) continue; // too short to be compared at all

            scored.push({ word, diff, lengthGap: Math.abs(word.length - term.length) });
        }

        return scored.sort((a, b) => {
            if (a.diff !== b.diff) return a.diff - b.diff;
            if (a.lengthGap !== b.lengthGap) return a.lengthGap - b.lengthGap;
            return a.word.localeCompare(b.word);
        });
    }
}
