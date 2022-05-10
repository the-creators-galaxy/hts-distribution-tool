<script lang="ts">
	import { onMount } from 'svelte';
	import { page, appVersion } from '../common/store';
	import { invoke } from '../common/ipc';
	import type { TreasuryInfo } from '../../common/primitives';
	import { Pages } from '../common/pages';
	import SignatoriesList from '../components/SignatoriesList.svelte';
	import InfoDialog from '../components/InfoDialog.svelte';

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
			<h2>
				General details
				<InfoDialog title="General details">
					<p>The <b>Network</b> setting identifies the Hedera network where the token exists.  The default is the <i>main</i> production network, but this tool can also interact with the hedera <i>test</i> network.</p>
					<p>The <b>Token ID</b> is the unique identifier of the Token in <i>&lt;shard&gt;.&lt;realm&gt;.&lt;num&gt;</i> form. </p>
				</InfoDialog>
			</h2>
			<label for="networkId">Network</label>
			<select bind:value={treasuryInfo.networkId} name="networkId">
				<option value="{1}">Main</option>
				<option value="{2}">Test</option>
			</select>
			<label for="token">Token id</label>
			<input type="text" bind:value={treasuryInfo.token} name="token" placeholder="E.g. 0.0.123"/>
		</fieldset>
		<fieldset>
			<h2>
				Treasury
				<InfoDialog title="Treasury">
					<p>The Treasury&rsquo;s <b>Account ID</b> identifies the crypto account holding the tokens to be distributed, it is entered in <i>&lt;shard&gt;.&lt;realm&gt;.&lt;num&gt;</i> form.</p>
					<p>The <b>Private Key</b> associated with the treasury may or may not be required depending on circumstances.  It is likely that you hold one or more private keys for the treasury account, this is where they should be entered.</p>
				</InfoDialog>
			</h2>
			<label for="tokenTreasury">Token treasury account id</label>
			<input type="text" bind:value={treasuryInfo.tokenTreasury} name="tokenTreasury" placeholder="E.g. 0.0.456"/>
			<label for="treasurySignatories">Treasury private keys(s) (optional)</label>
			<SignatoriesList bind:signatories={treasuryInfo.treasurySignatories}></SignatoriesList>
		</fieldset>
		<fieldset>
			<h2>
				Scheduling payer 
				<InfoDialog title="Scheduling payer">
					<p>The <b>Address ID</b> identifies the crypto account that will be charged for all transaction fees for submitting, countersigning, and collecting information for all processed distributions, except it is not necessarily that account that pays for the execution of the (scheduled) distribution itself.  It is entered in <i>&lt;shard&gt;.&lt;realm&gt;.&lt;num&gt;</i> form.  In some cases the distribution payer account may be the same as this account, but it is not required to be.</p>
					<p>At least one <b>Private Key</b> is required to be associated with this account.  If the account is multi-sig, then sufficient keys must be present that can satisfy the signing requirements to unlock this account since it pays for scheduling and countersigning operations.</p>
				</InfoDialog>
			</h2>
			<label for="submitPayer">Scheduling payer account id</label>
			<input type="text" bind:value={treasuryInfo.submitPayer} name="submitPayer" placeholder="E.g. 0.0.789"/>
			<label for="submitPayerSignatories">Scheduling payer private keys(s)</label>
			<SignatoriesList bind:signatories={treasuryInfo.submitPayerSignatories}></SignatoriesList>
		</fieldset>
		<fieldset>
			<h2>
				Distribution payer
				<InfoDialog title="Distribution payer">
					<p>The <b>Address ID</b> identifies the crypto account that pays for the scheduled distribution after sufficient parties have countersigned.  This value must be the same across all participating parties.  It is entered in <i>&lt;shard&gt;.&lt;realm&gt;.&lt;num&gt;</i> form.  Under certain circumstances it may be the same as the treasury or scheduling accounts.</p>
					<p>The <b>Private Key</b> associated with the distribution payer need only be entered by one participant, or not at all if the account is the same as the scheduling or treasury accounts.  If the account is multi-sig, then sufficient keys may be added here or entered individually by multiple participants to satisfy the signing requirements to unlock the account pay distribution transaction fees.</p>
				</InfoDialog>
			</h2>
			<label for="transferPayer">Distribution payer account id</label>
			<input type="text" bind:value={treasuryInfo.transferPayer} name="transferPayer" placeholder="E.g. 0.0.321"/>
			<label for="transferPayerSignatories">Distribution payer private keys(s) (optional)</label>
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
	p {
		margin-bottom: 1rem;
	}
	b, i {
		color: var(--cds-cs-500);
	}
</style>