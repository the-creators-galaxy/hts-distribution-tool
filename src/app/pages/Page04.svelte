<script lang="ts">
	import { onMount } from 'svelte';
	import type { DistributionPlanSummary } from '../../common/primitives';
	import { invoke } from '../common/ipc';
	import { page } from '../common/store';
	import ConfirmExecuteDialog from '../components/ConfirmExecuteDialog.svelte';
	import ErrorsTable from '../components/ErrorsTable.svelte';
	import PagingController from '../components/PagingController.svelte';
	import TransfersTable from '../components/TransfersTable.svelte';
	import WarningsTable from '../components/WarningsTable.svelte';
	import { Pages } from '../common/pages';

	let selectedTab = 0;
	let hasErrors = false;
	let hasWarnings = false;
	let progress = '';
	let plan: DistributionPlanSummary;

	let transferPageNo = 1;
	let warningsPageNo = 1;
	let errorsPageNo = 1;
	let pagedTransferData = [];
	let pagedWarningData = [];
	let pagedErrorData = [];
	let confirmDialog: ConfirmExecuteDialog;


	onMount(async () => {
		plan = await invoke('generate-distribution-plan', p => progress = p);
		hasErrors = plan.errors.length > 0;
		hasWarnings = plan.warnings.length > 0;		
		selectedTab = hasErrors ? 1 : ( hasWarnings ? 2 : 0);
	});	
	function clickGoBack() {
		$page = Pages.page03;
	}
	async function clickContinue() {
		if(!hasWarnings || (await confirmDialog.confirmExecutePlan())) {
			$page = Pages.page05;
		}
	}
</script>

<main>
	<header>
		<h1>Review distribution plan</h1>
		<div class="tcg-logo"></div>
	</header>
	{#if plan}
		{#if hasErrors || hasWarnings}
		<section>
			<div class="stats">
				<div class="tcg-stat-group">
					<div>Current Treasury Balance <span>{plan.treasuryBalance}</span></div>
				</div>
				<div class="tcg-stat-group">
					<div>Number of Tokens to be Transfered <span>{plan.totalTransfers}</span></div>
				</div>
			</div>
			<nav>				
				<div class="tcg-tab-strip">
					<button on:click={() => selectedTab = 0} class:selected="{selectedTab === 0}">Planned Distribution</button>
					{#if hasErrors}
					<button on:click={() => selectedTab = 1} class:selected="{selectedTab === 1}">Errors ({plan.errors.length})</button>
					{/if}
					{#if hasWarnings}
					<button on:click={() => selectedTab = 2} class:selected="{selectedTab === 2}">Warnings ({plan.warnings.length})</button>
					{/if}
				</div>	
				{#if selectedTab === 0}
				<PagingController allData={plan.transfers} bind:pagedData={pagedTransferData} bind:pageNumber={transferPageNo}></PagingController>
				{:else if selectedTab === 1}
				<PagingController allData={plan.errors} bind:pagedData={pagedErrorData} bind:pageNumber={warningsPageNo}></PagingController>
				{:else if selectedTab === 2}
				<PagingController allData={plan.warnings} bind:pagedData={pagedWarningData} bind:pageNumber={errorsPageNo}></PagingController>
				{/if}
			</nav>
			<div class="tab-page">
				{#if selectedTab === 0}
					<TransfersTable transfers={pagedTransferData} decimals={plan.decimals}/>
				{:else if selectedTab === 1}
					<ErrorsTable errors={pagedErrorData}/>
				{:else if selectedTab === 2}
					<WarningsTable warnings={pagedWarningData}/>
				{/if}
			</div>
		</section>
		{:else}
		<section class="no-errors-or-warnings">
			<nav>				
				<div>
					<div class="tcg-stat-group">
						<div>Current Treasury Balance <span>{plan.treasuryBalance}</span></div>
					</div>
					<div class="tcg-stat-group">
						<div>Number of Tokens to be Transfered <span>{plan.totalTransfers}</span></div>
					</div>
				</div>
				<PagingController allData={plan.transfers} bind:pagedData={pagedTransferData} bind:pageNumber={transferPageNo}></PagingController>
			</nav>
			<div class="tab-page">
				<TransfersTable transfers={pagedTransferData} decimals={plan.decimals}/>
			</div>
		</section>
		{/if}
		<footer>
			<button on:click={clickGoBack} class="secondary tcg-left-arrow-light">Go Back</button>
			{#if !hasErrors}
				{#if hasWarnings}
				<div class="with-warning">
					<div class="tcg-warning-icon"></div>
					<button on:click={clickContinue} class="action" class:tcg-warning-marker={hasWarnings}>Execute plan</button>
				</div>
				{:else}
				<button on:click={clickContinue} class="action">Execute plan</button>
				{/if}
			{/if}
		</footer>
	{:else}
		<section class="loading">
			<div>
				<div class="tcg-light-spinner">Generating Plan&mldr;</div>
				<p>{progress}</p>	
			</div>
		</section>
	{/if}
	<ConfirmExecuteDialog bind:this={confirmDialog}/>
</main>

<style>
	section.no-errors-or-warnings {
		grid-template-rows: max-content 1fr ;
	}
	section.loading {
		grid-template-rows: max-content;
		place-content: center;		
	}	
	section.loading > div {
		margin-bottom: 0.8rem;
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
	section.no-errors-or-warnings > nav {
		align-items: end;
	}
	div.tcg-stat-group+div.tcg-stat-group {
		margin-top: 0.5rem;
	}
	div.with-warning {
		display: grid;
		grid-template-columns: max-content max-content;
		align-items: center;
		column-gap: 1.5rem;
	}
</style>