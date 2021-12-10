import { writable } from 'svelte/store';
/**
 * Global state a reference to the
 * currently displayed page.
 */
export const page = writable(null);
/**
 * The current application version retrieved
 * from the node process (from package.json).
 */
export const appVersion = writable('unknown');
