<script lang="ts">
	import { onMount } from 'svelte';
	import { page, appVersion } from '../common/store';
	import { invoke } from '../common/ipc';
	import type { TreasuryInfo } from '../../common/primitives';
	import { Pages } from '../common/pages';
	import SignatoriesList from '../components/SignatoriesList.svelte';

	const digits = /^\d+$/;
	let treasuryInfo: TreasuryInfo;

	$: canContinue = treasuryInfo &&
			treasuryInfo.networkId &&
			isValidAddress(treasuryInfo.token) &&
			isValidAddress(treasuryInfo.submitPayer) &&
			isValidAddress(treasuryInfo.transferPayer) &&
			isValidAddress(treasuryInfo.tokenTreasury) &&
			treasuryInfo.submitPayerSignatories.length > 0 ?
				true : false;	

	onMount(async () => {
		treasuryInfo = await invoke('get-treasury-information');
	});	

	function clickGoBack() {
		$page = Pages.page02;
	}
	async function clickContinue() {
		await invoke('set-treasury-information', treasuryInfo);
		$page = Pages.page04;
	}
	function isValidAddress(value: string): boolean {
		if (value) {
			const parts = value.trim().split('.');
			if (parts.length == 3) {
				if (digits.test(parts[0]) && digits.test(parts[1]) && digits.test(parts[2])) {
					const shard = parseInt(parts[0], 10);
					const realm = parseInt(parts[1], 10);
					const num = parseInt(parts[2], 10);
					return shard > 0 || realm > 0 || num > 0;				                
				}
			}
		}
		return false;
	}
</script>

<main>
	<header>
		<h1>Enter distribution details</h1>
		<div class="tcg-logo">v{$appVersion}</div>
	</header>
	{#if (treasuryInfo)}
	<section>
		<fieldset>
			<h2>General details</h2>
			<label for="networkId">Network</label>
			<select bind:value={treasuryInfo.networkId} name="networkId">
				<option value="{1}">Main</option>
				<option value="{2}">Test</option>
			</select>
			<label for="token">Token ID</label>
			<input type="text" bind:value={treasuryInfo.token} name="token" placeholder="Enter token id&mldr;"/>
		</fieldset>
		<fieldset>
			<h2>Treasury</h2>
			<label for="tokenTreasury">Account ID</label>
			<input type="text" bind:value={treasuryInfo.tokenTreasury} name="tokenTreasury" placeholder="Enter token treasury account id&mldr;"/>
			<label for="treasurySignatories">Private keys(s) (Optional)</label>
			<SignatoriesList bind:signatories={treasuryInfo.treasurySignatories}></SignatoriesList>
		</fieldset>
		<fieldset>
			<h2>Scheduling Payer</h2>
			<label for="submitPayer">Account ID</label>
			<input type="text" bind:value={treasuryInfo.submitPayer} name="submitPayer" placeholder="Enter scheduling payer account id&mldr;"/>
			<label for="submitPayerSignatories">Private keys(s)</label>
			<SignatoriesList bind:signatories={treasuryInfo.submitPayerSignatories}></SignatoriesList>
		</fieldset>
		<fieldset>
			<h2>Distribution Payer</h2>
			<label for="transferPayer">Account ID</label>
			<input type="text" bind:value={treasuryInfo.transferPayer} name="transferPayer" placeholder="Enter distribution payer account id&mldr;"/>
			<label for="transferPayerSignatories">Private keys(s) (Optional)</label>
			<SignatoriesList bind:signatories={treasuryInfo.transferPayerSignatories}></SignatoriesList>
		</fieldset>
	</section>
	{:else}
	<section class="loading"><div class="tcg-light-spinner">Loading&mldr;</div></section>
	{/if}
	<footer>
		<button on:click={clickGoBack} class="secondary tcg-left-arrow-light">Go Back</button>
		{#if canContinue}
		<button on:click={clickContinue} class="action">Continue</button>
		{/if}
	</footer>
</main>

<style>
	section {
		display: block;
		overflow-x: hidden;
		overflow-y: auto;
		/* To push the scroll bar to the edge of the viewport */
		padding: 0 3rem 1.25rem 3rem;
		margin: 0;
	}
	section.loading {
		grid-template-rows: max-content;
		grid-template-columns: max-content;
		align-content: center;
		justify-content: center;
	}
	fieldset
	{
		background-color: var(--cds-nd-700);
		display: grid;
		grid-template-columns: 1fr;
		align-content: start;
		padding: 1rem 1rem 1.5rem 1rem;
		margin-bottom: 1.5rem;
		border-radius: 0.5rem;
	}
	h2 {
		margin: 0;
		padding: 0 0 0.5rem 0;
		color: var(--cds-nl-0);
		font-size: 1.2rem;
		line-height: 1.5rem;
		font-weight: 600;
		border-bottom: 1px solid var(  --cds-nd-500);		
	}
</style>