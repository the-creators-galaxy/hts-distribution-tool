<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '../common/ipc';
	import { page } from '../common/store';
	import DistributionsTable from '../components/DistributionsTable.svelte';
	import { Pages } from '../common/pages';

	let statusMessage = 'Scheduling Distribution Payments';
	let payments = [];
	let notStartedCount = 0;
	let schedulingCount = 0;
	let confirmingCount = 0;
	let completedCount = 0;	
	let showDetails = false;
	let summary: any = { };
	let completed = false;

	$: displayedPayments = payments.filter(p => p.inProgress);

	onMount(async () => {
		setTimeout(() => generateSummary(),1500);
		try {
			handleProgressUpdate(await invoke('execute-distribution-plan', handleProgressUpdate));
		} catch(err) {
			// we had a problem
			// actually go to next page
			alert(err.message || err.toString())
		}
		completed = true;
		generateSummary();
		$page = Pages.page06;
	});	
	function handleProgressUpdate(data:any) {
		if(data.message) {
			statusMessage = data.message;
		}
		if(data.payments) {
			payments = data.payments;
		}
		if(data.payment && payments[data.payment.index]) {
			payments[data.payment.index] = data.payment;
		}
	}
	function generateSummary() {
		notStartedCount = 0;
		schedulingCount = 0;
		confirmingCount = 0;
		completedCount = 0;	
		let newSummary = {};
		for(const item of payments) {
			const key = item.status;
			if(key) {
				newSummary[key] = (newSummary[key] || 0) + 1;
			}
			if(item.inProgress) {
				if(item.scheduleId) {
					confirmingCount = confirmingCount + 1;
				} else {
					schedulingCount = schedulingCount + 1;
				}
			} else {
				if(item.scheduleId) {
					completedCount = completedCount + 1;
				} else {
					notStartedCount = notStartedCount + 1;
				}
			}
		}
		summary = newSummary;
		if(!completed) {
			setTimeout(() => generateSummary(), 1500);
		}
	}
	function toggleDetails() {
		showDetails = !showDetails;
	}
</script>

<main>
	<header>
		<h1>Scheduling distribution</h1>
		<div class="tcg-logo"></div>
	</header>
	{#if payments.length > 0}
	<section>
		<p>{statusMessage}</p>
		<div class="info">
			<div class="summary">
				<div class="tcg-stat-group">
					<div>Not Started: <span>{notStartedCount}</span></div>
					<div>Scheduling: <span>{schedulingCount}</span></div>
					<div>Confirming: <span>{confirmingCount}</span></div>
					<div>Completed: <span>{completedCount}</span></div>
				</div>
				{#if showDetails}
				<button on:click={toggleDetails} class="hide">Hide details</button>
				{:else}
				<button on:click={toggleDetails} class="reveal">View details</button>
				{/if}
			</div>
			{#if showDetails}
			<div class="details">
				{#each Object.keys(summary) as item}
				<div><span class="label">{item}: </span><span class="count">{summary[item]}</span></div>
				{/each}
			</div>
			{/if}
		</div>
		<div class="tab-page">
			<DistributionsTable payments={displayedPayments}/>
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