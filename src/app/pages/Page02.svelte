<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '../common/ipc';
	import { page, appVersion } from '../common/store';
	import CsvErrorTable from '../components/CsvErrorTable.svelte';	
	import PagingController from '../components/PagingController.svelte';
	import RawCsvTable from '../components/RawCsvTable.svelte';
	import TransfersTable from '../components/TransfersTable.svelte';
	import { Pages } from '../common/pages';

	let csvData = null;
	let selectedTab = 0;
	let hasErrors = false;
	let transferPageNo = 1;
	let rawDataPageNo = 1;
	let errorDataPageNo = 1;
	let pagedTransferData = [];
	let pagedRawData = [];
	let pagedErrorData = [];

	onMount(async () => {
		csvData = await invoke('get-distribution-file-summary');
		hasErrors = csvData.errors.length > 0;
		selectedTab = hasErrors ? 2 : 0;
	});	

	function clickGoBack() {
		$page = Pages.page01;
	}

	function clickContinue() {
		$page = Pages.page03;
	}

</script>

<main>	
	<header>
		<h1>Review File</h1>
		<div class="tcg-logo">v{$appVersion}</div>
	</header>
	{#if csvData}
		<section>
			<div class="stats">
				<div class="tcg-stat-group">
					<div>Filename: <span>{csvData.filename}</span></div>
				</div>
				<div class="tcg-stat-group">
					<div>Rows: <span>{csvData.rows}</span></div>
					<div>Columns: <span>{csvData.columns}</span></div>
					<div>Transfers: <span>{csvData.transfers.length}</span></div>
					<div>Decimals: <span>{csvData.decimals}</span></div>
				</div>
			</div>
			<nav>
				<div class="tcg-tab-strip">
					<button on:click={() => selectedTab = 0} class:selected="{selectedTab === 0}">Transfers</button>
					<button on:click={() => selectedTab = 1} class:selected="{selectedTab === 1}">Raw Data</button>
					{#if hasErrors}
					<button on:click={() => selectedTab = 2} class:selected="{selectedTab === 2}" class="errors">Errors</button>
					{/if}
				</div>	
				{#if selectedTab === 0}
				<PagingController allData={csvData.transfers} bind:pagedData={pagedTransferData} bind:pageNumber={transferPageNo}></PagingController>
				{:else if selectedTab === 1}
				<PagingController allData={csvData.data} bind:pagedData={pagedRawData} bind:pageNumber={rawDataPageNo}></PagingController>
				{:else if selectedTab === 2}
				<PagingController allData={csvData.errors} bind:pagedData={pagedErrorData} bind:pageNumber={errorDataPageNo}></PagingController>
				{/if}
			</nav>
			<div class="tab-page">
				{#if selectedTab === 0}
				<TransfersTable transfers={pagedTransferData} decimals={csvData.decimals}/>
				{:else if selectedTab === 1}
				<RawCsvTable data={pagedRawData} columns={csvData.columns}/>
				{:else if selectedTab === 2}
				<CsvErrorTable errors={pagedErrorData}/>
				{/if}
			</div>
		</section>
	{:else}
		<section class="loading"><div class="tcg-light-spinner">Loading&mldr;</div></section>
	{/if}
	<footer>
		<button on:click={clickGoBack} class="secondary tcg-left-arrow-light">Go Back</button>
		{#if !hasErrors}
		<button on:click={clickContinue} class="action">Continue</button>
		{/if}
	</footer>
</main>

<style>
	section.loading {
		grid-template-rows: max-content;
		align-content: center;
		justify-content: center;
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
	div.stats {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;		
		column-gap: 1rem;
		row-gap: 0.5rem;
		font-size: 0.875rem;
	}
	.selected.errors {
		background-color: var(--tcg-red);
	}
</style>