<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '../common/ipc';
	import DistributionsTable from '../components/DistributionsTable.svelte';
	import ErrorsTable from '../components/ErrorsTable.svelte';
	import PagingController from '../components/PagingController.svelte';

	let selectedTab = 0;
	let results = null;
	let hasErrors = false;

	let transferPageNo = 1;
	let errorsPageNo = 1;
	let pagedTransferData = [];
	let pagedErrorData = [];

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
	});	
</script>

<main>
	{#if results}
		{#if hasErrors}
		<header>
			<h1>Distribution completed with errors</h1>
			<div class="tcg-logo"></div>
		</header>
		<section>
			<div class="tcg-error-notice">Scheduling complete with errors, please review the results</div>
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
		{:else}
		<header>
			<h1>Distribution completed</h1>
			<div class="tcg-logo"></div>
		</header>
		<section>
			<div class="tcg-success-notice">
				<div class="tcg-stat-group">
					<div>Completed <span>{results.payments.length}</span></div>
				</div>
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
		<div class="tcg-logo"></div>
	</header>
	<section class="loading">
		<div class="tcg-light-spinner">Loading Results&mldr;</div>
	</section>
	{/if}
</main>

<style>
	main {
		grid-template-rows: max-content 1fr;
	}
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
		margin-top: 1rem;
	}
	.tcg-error-notice {
		margin-top: 1rem;
	}
</style>