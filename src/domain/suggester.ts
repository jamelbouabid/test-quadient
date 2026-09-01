/**
 * Public contract of the domain: find the closest terms to a searched one among
 * a list of choices.
 *
 * This port belongs to the domain, which owns its shape; adapters (CLI, HTTP,
 * UI...) conform to it, never the other way round.
 */
export interface ISuggester {
    getSuggestions(term: string, choices: string[], numberOfSuggestions: number): string[];
}
