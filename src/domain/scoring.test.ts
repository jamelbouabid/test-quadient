import { describe, expect, it } from "vitest";
import { getBestDifferenceScore, getDifferenceScore, isAlphaNumeric } from "./scoring.js";

describe("getDifferenceScore", () => {
    it.each([
        { dest: "gros", src: "gros", expected: 0 },
        { dest: "gros", src: "gras", expected: 1 },
        { dest: "gros", src: "gret", expected: 2 },
        { dest: "gros", src: "abcd", expected: 4 },
        { dest: "", src: "", expected: 0 },
    ])("scores '$dest' against '$src' as $expected", ({ dest, src, expected }) => {
        expect(getDifferenceScore(dest, src)).toBe(expected);
    });

    // The subject defines this helper on two strings of equal length only.
    // Making the precondition explicit beats silently scoring out-of-range indexes.
    it("rejects operands of different lengths", () => {
        expect(() => getDifferenceScore("gros", "gro")).toThrow(/same length/i);
    });
});

describe("getBestDifferenceScore", () => {
    // The exact table from the subject, for the term 'gros'.
    it.each([
        { candidate: "gros", expected: 0 },
        { candidate: "gras", expected: 1 },
        { candidate: "graisse", expected: 2 },
        { candidate: "agressif", expected: 1 },
    ])("scores '$candidate' as $expected difference(s) from 'gros'", ({ candidate, expected }) => {
        expect(getBestDifferenceScore("gros", candidate)).toBe(expected);
    });

    // "pas du tout similaire (pas assez de lettres)" -> not comparable at all,
    // which is a different outcome from "comparable but far away".
    it.each(["go", "ros", "gro", ""])("returns null for '%s', shorter than the term", candidate => {
        expect(getBestDifferenceScore("gros", candidate)).toBeNull();
    });

    it("scores 0 when the candidate literally contains the term", () => {
        expect(getBestDifferenceScore("gros", "agrosse")).toBe(0);
    });

    it("keeps the best window, not the first one", () => {
        // 'xxxxgros': the leading window is a total mismatch, the trailing one is exact.
        expect(getBestDifferenceScore("gros", "xxxxgros")).toBe(0);
    });
});

describe("isAlphaNumeric", () => {
    it.each(["gros", "abc123", "42"])("accepts '%s'", value => {
        expect(isAlphaNumeric(value)).toBe(true);
    });

    it.each(["gr os", "gros!", "grös", ""])("rejects '%s'", value => {
        expect(isAlphaNumeric(value)).toBe(false);
    });
});
