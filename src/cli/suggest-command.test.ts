import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SuggestCommand } from "./suggest-command.js";
import type { ISuggester } from "../domain/suggester.js";

/**
 * Stand-in for the domain: records what the CLI layer forwarded, so these tests
 * cover argument parsing only and stay green when the algorithm changes.
 */
class SuggesterSpy implements ISuggester {
    calls: Array<{ term: string; choices: string[]; numberOfSuggestions: number }> = [];

    getSuggestions(term: string, choices: string[], numberOfSuggestions: number): string[] {
        this.calls.push({ term, choices, numberOfSuggestions });
        return ["stub"];
    }
}

describe("SuggestCommand", () => {
    let suggester: SuggesterSpy;
    let command: SuggestCommand;

    beforeEach(() => {
        suggester = new SuggesterSpy();
        command = new SuggestCommand(suggester);
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("argument parsing", () => {
        it("forwards the term, the split choices and the count", () => {
            command.execute(["gros", "gros,gras,graisse", "2"]);

            expect(suggester.calls).toEqual([
                { term: "gros", choices: ["gros", "gras", "graisse"], numberOfSuggestions: 2 },
            ]);
        });

        it("trims each choice and drops the empty ones", () => {
            command.execute(["gros", " gros , , gras ,", "2"]);

            expect(suggester.calls[0]?.choices).toEqual(["gros", "gras"]);
        });

        it("treats missing arguments as an empty request", () => {
            command.execute([]);

            expect(suggester.calls).toEqual([
                { term: "", choices: [], numberOfSuggestions: 0 },
            ]);
        });
    });

    describe("invalid count", () => {
        // Left unchecked, parseInt turns these into NaN and the command silently
        // returns nothing, which is the worst way to fail.
        it.each(["abc", "2.5", "-1", "1e3", "0x10", "2abc"])("rejects '%s' instead of failing silently", raw => {
            expect(() => command.execute(["gros", "gros,gras", raw])).toThrow(/number of suggestions/i);
            expect(suggester.calls).toEqual([]);
        });
    });

    describe("output", () => {
        it("prints the suggestions returned by the domain", () => {
            command.execute(["gros", "gros,gras", "2"]);

            const printed = vi.mocked(console.log).mock.calls.map(args => String(args[0])).join("\n");
            expect(printed).toContain("suggestions for gros: stub");
        });
    });
});
