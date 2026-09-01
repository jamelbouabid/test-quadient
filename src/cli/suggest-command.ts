import type { Command } from "./command.js";
import type { ISuggester } from "../domain/suggester.js";

interface SuggestArgs {
    term: string;
    choices: string[];
    numberOfSuggestions: number;
}

/**
 * CLI adapter: translates `argv` into a domain call, then the domain result into
 * standard output. No suggestion logic lives here.
 */
export class SuggestCommand implements Command {
    /** Depends on the `ISuggester` abstraction, not on a concrete implementation. */
    constructor(private readonly _suggester: ISuggester) {}

    execute(args: string[]): void {
        const { term, choices, numberOfSuggestions } = this._parseArgs(args);
        const suggestions = this._suggester.getSuggestions(term, choices, numberOfSuggestions);
        this._display(term, suggestions);
    }

    private _parseArgs(args: string[]): SuggestArgs {
        const term = (args[0] ?? "").trim();
        const choices = (args[1] ?? "")
            .split(",")
            .map(choice => choice.trim())
            .filter(Boolean);

        return { term, choices, numberOfSuggestions: this._parseCount(args[2]) };
    }

    /**
     * Only plain digits are accepted. `parseInt` would read "2abc" as 2 and
     * `Number` would read "0x10" as 16 or "1e3" as 1000, none of which a CLI user
     * means to type. Bad input is reported instead of collapsing into NaN and
     * returning an empty list, which would look like a legitimate "no match".
     */
    private _parseCount(raw: string | undefined): number {
        const value = (raw ?? "").trim();
        if (value === "") return 0;

        if (!/^\d+$/.test(value)) {
            throw new Error(`Invalid number of suggestions: "${raw}". Expected a positive integer.`);
        }
        return Number(value);
    }

    private _display(term: string, suggestions: string[]): void {
        console.log("--------------------------------");
        console.log(`suggestions for ${term}: ${suggestions.join(", ")}`);
        console.log("--------------------------------");
    }
}
