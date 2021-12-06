<script lang="ts">
import { onMount } from "svelte";

    let dialog;
    let resolveFn;
    let confirmChecked = false;
    let confirmClicked = false;

    export function confirmExecutePlan(): Promise<boolean> {
        confirmChecked = false;
        confirmClicked = false;
        dialog.showModal();
        return new Promise(resolve => resolveFn = resolve);
    }
    onMount(async () => {
        dialog.addEventListener('close', ()=>resolveFn(confirmChecked && confirmClicked));
	});    
    function onConfirm() {
        confirmClicked = true;
        dialog.close();
    }
    function onCancel() {
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <section>
        <button on:click={onCancel} class="close-dialog"></button>
        <div>
            <div class="tcg-warning-icon"></div>
            <h1>Are you sure you want to continue?</h1>
            <label>
                <input type="checkbox" bind:checked={confirmChecked}/>
                I acknowledge these warnings and wish to proceed to execute the distribution plan.
            </label>
            <button on:click={onConfirm} class="action" disabled={!confirmChecked}>Execute plan</button>
        </div>
    </section>
</dialog>

<style>
    dialog > section {
        display: grid;
        grid-template-rows: max-content 1fr;
        margin: 0;
        padding: 0 0 1rem 0;
        width: min(90vw, 28rem);
        min-height: 17rem;
    }
    dialog > section > div
    {
        display: grid;
        grid-template-rows: max-content max-content max-content 1fr;
        overflow-x: hidden;
        overflow-y: auto;
        justify-items: center;
        padding: 0 3em;
    }
    button.close-dialog {
        justify-self: end;
        margin: 1rem 1rem 0 0;
    }
    div.tcg-warning-icon {
        width: 2rem;
    }
    h1 {
        margin: 1rem 0;
        padding: 0;
        font-weight: 600;
        font-size: 1.25rem;
    }
    label 
    {
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.3125rem;
        margin: 0;
        padding: 0;
    }
    button.action {
        align-self: center;
        font-size: 1rem;
        line-height: 1.5rem;
        margin: 0;
        padding: 0.375rem 1rem;
    }
</style>
