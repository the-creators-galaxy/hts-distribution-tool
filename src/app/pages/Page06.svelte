<script lang="ts">
	import { onMount } from 'svelte';
	import { appVersion, page } from '../common/store';
	import { invoke } from '../common/ipc';
	import { Pages } from '../common/pages';
	import ConfirmExitDialog from '../components/ConfirmExitDialog.svelte';
	import DistributionsTable from '../components/DistributionsTable.svelte';
	import ErrorsTable from '../components/ErrorsTable.svelte';
	import PagingController from '../components/PagingController.svelte';

	let selectedTab = 0;
	let results = null;
	let hasErrors = false;
	let showRetry = false;

	let transferPageNo = 1;
	let errorsPageNo = 1;
	let pagedTransferData = [];
	let pagedErrorData = [];

	let saving = false;

	onMount(async () => {
		try {
			results = await invoke('get-distribution-results');
		} catch(err) {
			results = {
				payments: [],
				errors: [(err.message || err.toString())]
			};
		}
		hasErrors = results.errors.length > 0;
		selectedTab = hasErrors ? 1 : 0;
		showRetry = results.payments.length > 0 && results.errors.length > 0 && results.errors[0] === 'The Network Nodes appear to be too busy to process distributions at this time.';
	});	

	async function saveResultsToFile(): Promise<void> {
		saving = true;		
		const filename = await invoke('query-user-for-output-file');
		if(filename) {
			try {
				await invoke('save-results-output-file', filename);
			} catch(err) {
				alert(`Sorry, an unexpected error occurred: ${err.message || JSON.stringify(err)}`);
			}
		}
		saving = false;
	}

	function clickTryAgain() {
		$page = Pages.page05;
	}

	function clickGoBack(){
		$page = Pages.page04;
	}
</script>

<main>
	{#if results}
		{#if hasErrors}
		<header>
			<h1>Distribution completed with errors</h1>
			<div class="tcg-logo">v{$appVersion}</div>
		</header>
		<section>
			<div class="tcg-error-notice">
				<div>Scheduling complete with errors, please review the results</div>
				{#if saving}
				<button class="tcg-light-spinner" disabled>Saving&mldr;</button>	
				{:else}
				<button on:click={saveResultsToFile} class="tcg-light-download">Save to file</button>
				{/if}
			</div>
			<nav>				
				<div class="tcg-tab-strip">
					<button on:click={() => selectedTab = 0} class:selected="{selectedTab === 0}">Completed</button>
					<button on:click={() => selectedTab = 1} class:selected="{selectedTab === 1}">Errors ({results.errors.length})</button>
				</div>	
				{#if selectedTab === 0}
				<PagingController allData={results.payments} bind:pagedData={pagedTransferData} bind:pageNumber={transferPageNo}></PagingController>
				{:else if selectedTab === 1}
				<PagingController allData={results.errors} bind:pagedData={pagedErrorData} bind:pageNumber={errorsPageNo}></PagingController>
				{/if}
			</nav>
			<div class="tab-page">
				{#if selectedTab === 0}
					<DistributionsTable payments={pagedTransferData}/>
				{:else if selectedTab === 1}
					<ErrorsTable errors={pagedErrorData}/>
				{/if}
			</div>
		</section>
			{#if showRetry}
				<footer>
					<button on:click={clickGoBack} class="secondary tcg-left-arrow-light">Go Back</button>
					<button on:click={clickTryAgain} class="action">Try again</button>
				</footer>
			{/if}
		{:else}
		<header>
			<h1>Distribution completed</h1>
			<div class="tcg-logo">v{$appVersion}</div>
		</header>
		<section>
			<div class="tcg-success-notice">
				<div class="tcg-stat-group">
					<div>Completed <span>{results.payments.length}</span></div>
				</div>
				{#if saving}
				<button class="tcg-light-spinner" disabled>Saving&mldr;</button>	
				{:else}
				<button on:click={saveResultsToFile} class="tcg-light-download">Save to file</button>
				{/if}
			</div>
			<nav class="no-tabs">
				<PagingController allData={results.payments} bind:pagedData={pagedTransferData} bind:pageNumber={transferPageNo}></PagingController>
			</nav>
			<div class="tab-page">
				<DistributionsTable payments={pagedTransferData}/>
			</div>
		</section>
		{/if}
	{:else}
	<header>
		<h1>Distribution completed</h1>
		<div class="tcg-logo">v{$appVersion}</div>
	</header>
	<section class="loading">
		<div class="tcg-light-spinner">Loading Results&mldr;</div>
	</section>
	{/if}
	{#if saving}
		<ConfirmExitDialog message="This will interrupt the save in progress."/>
	{/if}
</main>

<style>
	section {
		grid-template-rows: max-content max-content 1fr ;
	}
	section.loading {
		grid-template-rows: max-content;
		place-content: center;
	}
	section.loading > div {
		min-width: min(80vw, 20rem);
	}
	nav {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		column-gap: 1rem;
		row-gap: 1rem;
		min-height: 2.25rem;
		margin: 1.5rem 0;
	}
	nav.no-tabs {
		justify-content: end;
	}
	.tcg-success-notice {		
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
		row-gap: 1rem;
		margin-top: 1rem;
	}
	.tcg-error-notice {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
		row-gap: 1rem;
		margin-top: 1rem;
	}
	.tcg-success-notice > button {		
		color: var(--cds-cs-500);
	}
	.tcg-error-notice > button {
		color: var(--cds-ct-400);
	}
</style>