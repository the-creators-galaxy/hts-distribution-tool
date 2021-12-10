<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '../common/ipc';
	import { page } from '../common/store';
	import DistributionsTable from '../components/DistributionsTable.svelte';
	import { Pages } from '../common/pages';

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
		<div class="tcg-logo"></div>
	</header>
	{#if data}
	<section>
		<p>{data.statusMessage}</p>
		<div class="info">
			<div class="summary">
				<div class="tcg-stat-group">
					<div>Not Started: <span>{data.notStartedCount}</span></div>
					<div>Scheduling: <span>{data.schedulingCount}</span></div>
					<div>Confirming: <span>{data.confirmingCount}</span></div>
					<div>Completed: <span>{data.completedCount}</span></div>
				</div>
				{#if showDetails}
				<button on:click={toggleDetails} class="hide">Hide details</button>
				{:else}
				<button on:click={toggleDetails} class="reveal">View details</button>
				{/if}
			</div>
			{#if showDetails}
			<div class="details">
				{#each Object.keys(data.summary) as item}
				<div><span class="label">{item}: </span><span class="count">{data.summary[item]}</span></div>
				{/each}
			</div>
			{/if}
		</div>
		<div class="tab-page">
			<DistributionsTable payments={data.payments}/>
		</div>
	</section>
	{/if}
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
		background-color: var(--tcg-dark-gray2);
		padding: 1.125rem 1.5rem;
		margin: 1.25rem 0 1.5rem 0;
	}
	div.summary {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
		row-gap: 1rem;
	}
	div.summary > button {
		margin-left: auto;
	}
	div.details {
		font-size: 0.875rem;
		line-height: 1.2rem;
		border-top: 1px solid var(--tcg-dark-gray);
		margin-top: 1.125rem;
		padding-top: 1.125rem;
		grid-column: 1 / 3;
	}
	span.count {
		min-width: 6rem;
		text-align: right;
		color: var(--tcg-white);
	}
</style>