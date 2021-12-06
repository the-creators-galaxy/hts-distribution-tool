import { writable } from 'svelte/store';
/**
 * Global state a reference to the
 * currently displayed page.
 */
export const page = writable(null);
