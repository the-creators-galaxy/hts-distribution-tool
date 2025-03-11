<script lang="ts">
    import { onMount } from "svelte";
    import type { Signatory } from "../../common/primitives";
    import { invoke } from "../common/ipc";

    let dialog;
    let resolveFn;
    let confirmed = false;
    let signatory: Signatory | null;
    let error: string | undefined | null;
    let privateKeyHex: string | undefined | null;

    $: {
        error = null;
        signatory = null;
        if(privateKeyHex) {
            invoke('validate-private-key', privateKeyHex.trim()).then(sig => {
                signatory = sig;
            }, err =>{
                error = (err as Error).message || err.toString();
            });
        }
    }

    export function tryGetSignatory(): Promise<Signatory | null> {        
        confirmed = false;
        error = null;
        signatory = null;
        privateKeyHex = '';
        dialog.showModal();
        return new Promise(resolve => resolveFn = resolve);
    }    

    onMount(async () => {
        dialog.addEventListener('close', ()=>resolveFn(confirmed ? signatory: null));
	});    

    async function onPaste() {
        privateKeyHex = await navigator.clipboard.readText();
    }

    function onConfirm() {
        confirmed = true;
        dialog.close();
    }

    function onCancel() {
        confirmed = false;
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <section>
        <header>
            <h1>Add Private Key</h1>    
            <button on:click={onCancel} class="close-dialog"></button>
        </header>
        <div>
            <div class="input-key">
                <input type="text" bind:value={privateKeyHex} name="privateKey" placeholder="E.g. 302e020100300506032b657004220420&mldr;"/>
                <button class="paste-from-clipboard" on:click={onPaste} ></button>
            </div>        
            {#if error}
                <div class="message error">{error}</div>
            {:else if signatory} 
                <div class="message">Recognized <span class="key-type">{signatory.keyType}</span> private key matching public key <span class="pub-key">{signatory.publicKey}</span></div>
            {:else if !privateKeyHex}
                <div class="message">Please enter an ED25519 or ECDSA private key.</div>
            {/if}    
            <button on:click={onConfirm} class="action" disabled={!signatory}>Add { signatory ? signatory.keyType : '' } Key</button>
        </div>
    </section>
</dialog>

<style>
    dialog > section {
        display: grid;
        grid-template-rows: max-content 1fr;
        margin: 0;
        padding: 0;
        width: min(90vw, 46rem);
        min-height: 17rem;
        color: var(--cds-nl-500);
    }
    dialog > section > header {
        display: grid;
        grid-template-columns: 1fr max-content;
        column-gap: 1rem;
        align-items: center;
        justify-items: center;
        margin: 0;
        padding: 1rem;
        border-bottom: 1px solid var(--cds-nd-600);
    }
    dialog > section > div
    {
        display: grid;
        grid-template-rows: max-content 1fr max-content;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 1rem 3em;
    }
    button.close-dialog {
        align-self: flex-end;
        justify-self: flex-end;
    }
    button.action {
        justify-self: end;
    }
    h1 {
        margin: 0;
        padding: 0;
        font-weight: 600;
        font-size: 1.25rem;        
    }
    button.action {
        align-self: center;
        font-size: 1rem;
        line-height: 1.5rem;
        margin: 0;
        padding: 0.375rem 1rem;
    }
    div.input-key {
        display: grid;
        grid-template-columns: 1fr max-content;
        column-gap: 0.375rem;
    }
    div.message {
        margin: 1rem 0;
        overflow: hidden;
        overflow-wrap: break-word;
    }
    div.error {
        color: var(--cds-ct-500);
    }
    span.key-type {
        font-style: italic;
        color: var(--cds-cs-600);
    }
    span.pub-key {
        color: var(--cds-cs-600);
    }
</style>
