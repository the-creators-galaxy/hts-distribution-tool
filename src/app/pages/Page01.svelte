<script lang="ts">
	import { page } from '../common/store';
	import { invoke } from '../common/ipc';		
	import { Pages } from '../common/pages';

	let processing = false;

	async function openFileDialog(): Promise<void> {
		processing = true;		
		const filename = await invoke('query-user-for-csv-file');
		if(filename) {
			await invoke('load-distribution-file', filename);
			$page = Pages.page02;
		}
		processing = false;
	}
</script>

<main>
	<div class="tcg-logo"></div>
	<section>
		<h1>Upload file</h1>
		<p>Upload CSV file containing the account ID’s and amounts to distribute</p>
		{#if processing} 
			<button class="action tcg-dark-spinner" disabled>Processing&mldr;</button>	
		{:else}
			<button on:click={openFileDialog} class="action">Upload CSV file</button>
		{/if}
	</section>
</main>

<style>
	main {
		grid-template-rows: max-content 1fr;
		align-items: center;
		overflow-y: auto;
	}
	section {
		display: block;
		text-align: center;
		margin: 0 auto;
		padding-bottom: 4rem;
	}
	p {
		margin: 0.6rem auto 1.2rem auto;
		max-width: 20rem;
	}
	.tcg-logo {
		margin: 3rem auto 0 auto;
	}
</style>