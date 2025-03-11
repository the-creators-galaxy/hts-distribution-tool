import { mount } from 'svelte';
import App from './App.svelte';
/**
 * The main Svelte Application instance,
 * this is the root entry point for the
 * user interface.
 */
const app = mount(App, { target: document.body });

export default app;
