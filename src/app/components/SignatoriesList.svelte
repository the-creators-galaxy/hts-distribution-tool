<script lang="ts">
    import type { Signatory } from "../../common/primitives";
    import { invoke } from "../common/ipc";

    let privateKey: string;
    
    export let signatories:Signatory[];

	async function clickAddPrivateKey() {
		if(privateKey) {
			try
			{
            	const key = await invoke('validate-private-key', privateKey);
				if(key && !signatories.find(k => k.publicKey === key.publicKey)) {
					signatories.push(key);
					signatories = signatories;
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
		signatories.splice(index,1);
		signatories = signatories;
	}
</script>

<div class="keylist">
    {#if signatories}
        {#each signatories as {publicKey}, index}
            <div class="read-only-input">{publicKey}</div>
            <button on:click={() => clickRemovePrivateKey(index)} class="remove-item"></button>
        {/each}
    {/if}
    <input type="text" bind:value={privateKey} name="privateKey" placeholder="Enter private key value&mldr;"/>
    <button on:click={clickAddPrivateKey} class="add-item"></button>
</div>

<style>
	div.keylist
	{
        margin: 0;
		display: grid;
		grid-template-columns: 1fr max-content;
		column-gap: 1rem;
		row-gap: 1.25rem;
	}
</style>