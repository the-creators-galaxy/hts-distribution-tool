<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '../common/ipc';
	import { page, appVersion } from '../common/store';
	import { Pages } from '../common/pages';
	import ConfirmExitDialog from '../components/ConfirmExitDialog.svelte';
	import DistributionsTable from '../components/DistributionsTable.svelte';

	let data = null;
	let showDetails = false;

	onMount(async () => {
		try {
			await invoke('execute-distribution-plan', handleProgressUpdate);
		} catch(err) {
			alert(err.message || err.toString())
		}
		$page = Pages.page06;
		
		function handleProgressUpdate(newDatadata:any) {
			data = newDatadata;
		}
	});	
	function toggleDetails() {
		showDetails = !showDetails;
	}
</script>

<main>
	<header>
		<h1>Scheduling distribution</h1>
		<div class="tcg-logo">v{$appVersion}</div>
	</header>
	{#if data}
	<section>
		<p>{data.statusMessage}</p>
		{#if showDetails}
			<div class="info">
				<div class="summary">
					<ul class="inline">
						<li>Not Started: <span>{data.notStartedCount}</span></li>
						<li>Processing: <span>{data.processingCount}</span></li>
						<li>Scheduled: <span>{data.scheduledCount}</span></li>
						<li>Completed: <span>{data.completedCount}</span></li>
						<li>Failed: <span>{data.failedCount}</span></li>
					</ul>
					<button on:click={toggleDetails} class="hide">Hide details</button>
				</div>
			</div>
			<div class="tab-page">
				<DistributionsTable payments={data.payments}/>
			</div>
		{:else}
			<div class="info">
				<div class="summary">
					<ul>
						<li>Not Started: <span>{data.notStartedCount}</span></li>
						<li>Processing:
							<ul>
								<li>Scheduling: <span>{data.schedulingCount}</span></li>
								<li>Countersigning: <span>{data.countersigningCount}</span></li>
								<li>Confirming: <span>{data.confirmingCount}</span></li>
							</ul>
						</li>
						<li>Scheduled: <span>{data.scheduledCount}</span></li>
						<li>Completed: <span>{data.completedCount}</span></li>
						<li>Failed: <span>{data.failedCount}</span></li>
					</ul>
					<button on:click={toggleDetails} class="reveal">View details</button>
				</div>
			</div>
		{/if}
	</section>
	{/if}
	<ConfirmExitDialog />
</main>

<style>
	main {
		grid-template-rows: max-content 1fr;
	}
	p {
		font-size: 0.875rem;
		line-height: 0.875rem;
		font-weight: 400;
	}
	div.info {
		border-radius: 0.75rem;
		background-color: var(--cds-nd-700);
		padding: 1.125rem 1.5rem;
		margin: 1.25rem 0 1.5rem 0;
	}
	div.summary {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		column-gap: 1rem;
		row-gap: 1rem;
	}
	div.summary > button {
		margin-left: auto;
	}
	ul {
		margin: 0;
	}
	li {
		color: var(--cds-nl-700);
	}
	li > span {
		color: var(--cds-nl-0);
	}
	ul.inline {
		margin-top: 0.375rem;
		padding: 0;
		display: inline-block;
		list-style: none;
	}
	ul.inline > li {
		display: inline-block;
		margin-right: 1rem;
	}
</style>