<script lang="ts">
	import { onMount } from 'svelte';
	import { page, appVersion } from '../common/store';
	import { invoke } from '../common/ipc';
	import type { TreasuryInfo } from '../../common/primitives';
	import { Pages } from '../common/pages';

	const digits = /^\d+$/;
	let treasuryInfo: TreasuryInfo;
	let privateKey: string;

	$: canContinue = treasuryInfo &&
			treasuryInfo.networkId &&
			isValidAddress(treasuryInfo.token) &&
			isValidAddress(treasuryInfo.submitPayer) &&
			isValidAddress(treasuryInfo.transferPayer) &&
			isValidAddress(treasuryInfo.tokenTreasury) &&
			!(privateKey?.length > 0) &&
			treasuryInfo.signatories.length > 0 ?
				true : false;	

	onMount(async () => {
		treasuryInfo = await invoke('get-treasury-information');
	});	

	async function clickAddPrivateKey() {
		if(privateKey) {
			try
			{
            	const key = await invoke('validate-private-key', privateKey);
				if(key && !treasuryInfo.signatories.find(k => k.publicKey === key.publicKey)) {
					treasuryInfo.signatories.push(key);
					treasuryInfo.signatories = treasuryInfo.signatories;
					privateKey = '';					
				}
			}
			catch
			{
				// Key management will change so this portion
				// is not implemented at this time.
			}
		}
	}
	function clickRemovePrivateKey(index) {
		treasuryInfo.signatories.splice(index,1);
		treasuryInfo.signatories = treasuryInfo.signatories;
	}
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
			<label for="networkId">Network</label>
			<select bind:value={treasuryInfo.networkId} name="networkId">
				<option value="{1}">Main</option>
				<option value="{2}">Test</option>
			</select>
			<label for="token">Token ID</label>
			<input type="text" bind:value={treasuryInfo.token} name="token" placeholder="Enter token ID&mldr;"/>
			<label for="tokenTreasury">Token Treasury</label>
			<input type="text" bind:value={treasuryInfo.tokenTreasury} name="tokenTreasury" placeholder="Enter token treasury&mldr;"/>
		</fieldset>
		<fieldset>
			<label for="submitPayer">Scheduling Payer</label>
			<input type="text" bind:value={treasuryInfo.submitPayer} name="submitPayer" placeholder="Enter scheduling payer&mldr;"/>
			<label for="transferPayer">Distribution Payer</label>
			<input type="text" bind:value={treasuryInfo.transferPayer} name="transferPayer" placeholder="Enter distribution payer&mldr;"/>
		</fieldset>
		<div class="keylist">
			<div class="label">Signing Keys</div>
			<label for="privateKey">Add private keys</label>
			<p>Please enter an ED25519 private key value in hex</p>
			<div class="list">
				{#each treasuryInfo.signatories as {publicKey}, index}
					<div class="read-only-input">{publicKey}</div>
					<button on:click={() => clickRemovePrivateKey(index)} class="remove-item"></button>
				{/each}
				<input type="text" bind:value={privateKey} name="privateKey" placeholder="Enter private key value&mldr;"/>
				<button on:click={clickAddPrivateKey} class="add-item"></button>
			</div>
		</div>
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
		grid-template-columns: 1fr 1fr;
		grid-template-rows: max-content 1fr ;
		column-gap: 3rem;
		overflow-x: hidden;
		overflow-y: auto;
		/* To push the scroll bar to the edge of the viewport */
		padding: 0 3rem;
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
		display: grid;
		grid-template-columns: 1fr;
		align-content: start;
	}
	div.keylist
	{
		display: grid;
		grid-template-columns: 1fr;
		align-content: start;
		grid-column: 1 / 3;
		margin: 2rem 0 1rem 0;
	}
	div.keylist > div.label
	{
		color: var(--tcg-white);
		font-size: 1.125rem;
		font-weight: 600;
		padding: 0 0 0.5rem 0;
		border-bottom: 1px solid var(--tcg-medium-gray);
	}
	div.keylist > div.list
	{
		display: grid;
		grid-template-columns: 1fr max-content;
		column-gap: 1rem;
		row-gap: 1.25rem;
	}
	div.keylist > label
	{
		line-height: 1rem;
		margin: 16px 0 0 0;
	}
	div.keylist > p
	{
		font-size: 0.875rem;
		line-height: 0.875rem;
		margin: 12px 0;
		padding: 0;
	}
	@media only screen and (max-width: 580px) {
		section {
			display: block;
			overflow: auto;
		}
    }	
</style>