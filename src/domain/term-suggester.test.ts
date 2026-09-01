import { describe, expect, it } from "vitest";
import { TermSuggester } from "./term-suggester.js";

const SUBJECT_CHOICES = ["gros", "gras", "graisse", "agressif", "go", "ros", "gro"];

// TermSuggester holds no state, so a single instance is safely shared.
const suggester = new TermSuggester();

describe("TermSuggester", () => {
    describe("the example from the subject", () => {
        // Expected ranking for 'gros':
        //   gros     0 diff, length gap 0
        //   gras     1 diff, length gap 0
        //   agressif 1 diff, length gap 4
        //   graisse  2 diff, length gap 3
        //   go / ros / gro: excluded, shorter than the term
        it("returns 'gros' then 'gras' for 2 suggestions", () => {
            expect(suggester.getSuggestions("gros", SUBJECT_CHOICES, 2)).toEqual(["gros", "gras"]);
        });

        it("returns 'agressif' third, ahead of the shorter-scoring noise", () => {
            expect(suggester.getSuggestions("gros", SUBJECT_CHOICES, 3)).toEqual([
                "gros",
                "gras",
                "agressif",
            ]);
        });

        it("never surfaces candidates shorter than the term, whatever N", () => {
            expect(suggester.getSuggestions("gros", SUBJECT_CHOICES, 99)).toEqual([
                "gros",
                "gras",
                "agressif",
                "graisse",
            ]);
        });
    });

    describe("ranking rules, one at a time", () => {
        it("orders by difference count first", () => {
            expect(suggester.getSuggestions("gros", ["gret", "gras", "gros"], 3)).toEqual([
                "gros",
                "gras",
                "gret",
            ]);
        });

        it("breaks a difference tie by closeness in length", () => {
            // Both are 1 difference away; 'gras' matches the term's length.
            expect(suggester.getSuggestions("gros", ["agressif", "gras"], 2)).toEqual([
                "gras",
                "agressif",
            ]);
        });

        it("breaks a remaining tie alphabetically", () => {
            // 'geos' and 'gras' are both 1 difference away with the same length.
            expect(suggester.getSuggestions("gros", ["gras", "geos"], 2)).toEqual(["geos", "gras"]);
        });
    });

    describe("edge cases", () => {
        it.each([0, -1])("returns nothing for N = %i", numberOfSuggestions => {
            expect(suggester.getSuggestions("gros", SUBJECT_CHOICES, numberOfSuggestions)).toEqual([]);
        });

        it.each(["", "   "])("returns nothing for the blank term '%s'", term => {
            expect(suggester.getSuggestions(term, SUBJECT_CHOICES, 3)).toEqual([]);
        });

        it("returns nothing when no choice is offered", () => {
            expect(suggester.getSuggestions("gros", [], 3)).toEqual([]);
        });

        it("caps the result at the number of eligible choices", () => {
            expect(suggester.getSuggestions("gros", ["gros"], 5)).toEqual(["gros"]);
        });

        it("suggests each word once, even if the list repeats it", () => {
            expect(suggester.getSuggestions("gros", ["gros", "gros", "gras"], 3)).toEqual([
                "gros",
                "gras",
            ]);
        });

        it("ignores choices that are not alphanumeric", () => {
            expect(suggester.getSuggestions("gros", ["gr-s", "gros"], 3)).toEqual(["gros"]);
        });

        it("compares regardless of case and surrounding blanks", () => {
            expect(suggester.getSuggestions("  GROS ", ["  GrOs  "], 1)).toEqual(["gros"]);
        });

        it("does not mutate the caller's list", () => {
            const choices = [...SUBJECT_CHOICES];
            suggester.getSuggestions("gros", choices, 3);
            expect(choices).toEqual(SUBJECT_CHOICES);
        });
    });
});
