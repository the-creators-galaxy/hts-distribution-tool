<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from './common/ipc';
	import { Pages } from './common/pages';
	import { page, appVersion } from './common/store';
	import Page01 from './pages/Page01.svelte';
	import Page02 from './pages/Page02.svelte';
	import Page03 from './pages/Page03.svelte';
	import Page04 from './pages/Page04.svelte';
	import Page05 from './pages/Page05.svelte';
	import Page06 from './pages/Page06.svelte';
	
	$: displayComponent = findPageComponent($page);

	function findPageComponent(page: Pages) {
		switch(page) {
			case Pages.page01: return Page01;
			case Pages.page02: return Page02;
			case Pages.page03: return Page03;
			case Pages.page04: return Page04;
			case Pages.page05: return Page05;
			case Pages.page06: return Page06;
		}
		return Page01;
	}

	onMount(async () => {
		try {
			$appVersion = await invoke('get-app-version');
		} catch(err) {
			console.error(`Unable to determine the application version: ${(err as Error).message || JSON.stringify(err)}`);
		}
	});	

</script>

<svelte:component this={displayComponent}/>