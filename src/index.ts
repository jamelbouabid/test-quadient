import type { Command } from "./cli/command.js";
import { SuggestCommand } from "./cli/suggest-command.js";
import { TermSuggester } from "./domain/term-suggester.js";

/**
 * Composition root: the only place aware of concrete implementations and how
 * they are wired together. Everything else deals in abstractions.
 */
const commands: Record<string, Command> = {
    suggest: new SuggestCommand(new TermSuggester()),
};

const [name, ...args] = process.argv.slice(2);
const command = name ? commands[name.toLowerCase()] : undefined;

if (!command) {
    console.log(`Available commands: ${Object.keys(commands).join(", ")}`);
} else {
    // Commands report bad input by throwing; turning that into a readable message
    // and a non-zero exit code belongs to the entry point, not to each command.
    try {
        command.execute(args);
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
