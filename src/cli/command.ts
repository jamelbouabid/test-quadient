/**
 * Contract of a CLI command. Belongs to the `cli` layer: the domain has no
 * reason to know what a command is.
 */
export interface Command {
    execute(args: string[]): void;
}
