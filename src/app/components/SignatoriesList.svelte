<script lang="ts">
	import AddSignatoryDialog from "./AddSignatoryDialog.svelte";
    import type { Signatory } from "../../common/primitives";

	let addSignatoryDialog: AddSignatoryDialog;
    
    export let signatories:Signatory[];

	async function clickAddPrivateKey() {
		const signatory = await addSignatoryDialog.tryGetSignatory();
		if(signatory && !signatories.find(k => k.publicKey === signatory.publicKey)) {
			signatories.push(signatory);
			signatories = signatories;
		}
	}

	function clickRemovePrivateKey(index) {
		signatories.splice(index,1);
		signatories = signatories;
	}
</script>

<div class="keylist">
    {#if signatories}
        {#each signatories as {keyType, publicKey}, index}
            <div class="read-only-input"><span class="keytype">{keyType}</span> {publicKey}</div>
            <button on:click={() => clickRemovePrivateKey(index)} class="remove-item"></button>
        {/each}
    {/if}
	{#if signatories && signatories.length > 0}
    	<div></div>
	{:else}
		<div class="empty">No Keys in list</div>
	{/if}
    <button on:click={clickAddPrivateKey} class="add-item"></button>
	<AddSignatoryDialog bind:this={addSignatoryDialog}/>
</div>

<style>
	div.keylist
	{
        margin: 0;
		display: grid;
		grid-template-columns: 1fr max-content;
		column-gap: 1rem;
		row-gap: 1.25rem;
		align-items: center;
	}
	span.keytype {
		color: var(--cds-nl-700);
		margin-right: 0.5em;
	}
	div.empty {
		color: var(--cds-nl-700);
		font-size: 0.8rem;
		padding: 0 1rem;
	}
</style>