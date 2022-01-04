<script lang="ts">

    let dialog;
    let closeAppConfirmed = false;

    export let message = 'This will halt the distribution in process.';
   
	function onBeforeUnload(event) {
		if(!closeAppConfirmed) {
			event.preventDefault();
			event.returnValue = false;
            dialog.showModal();
		}
	}
        
    function onConfirmCloseApp() {
        closeAppConfirmed = true;
        window.close();
    }

    function onCancelCloseApp() {
        closeAppConfirmed = false;
        dialog.close();
    }
</script>

<svelte:window on:beforeunload={onBeforeUnload}/>
<dialog bind:this={dialog}>
    <section>
        <button on:click={onCancelCloseApp} class="close-dialog"></button>
        <div class="content">
            <div class="tcg-warning-icon"></div>
            <h1>Are you sure you want exit?</h1>
            <p>{message}</p>
        </div>
        <div class="footer">
            <button on:click={onCancelCloseApp} class="secondary tcg-left-arrow-light">Go Back</button>
            <button on:click={onConfirmCloseApp} class="action">Exit</button>
        </div>        
    </section>
</dialog>

<style>
    dialog > section {
        display: grid;
        grid-template-rows: max-content 1fr max-content;
        margin: 0;
        padding: 0 0 1rem 0;
        width: min(90vw, 28rem);
        min-height: 17rem;
    }
    dialog > section > div.content
    {
        display: grid;
        grid-template-rows: max-content max-content max-content 1fr;
        overflow-x: hidden;
        overflow-y: auto;
        justify-items: center;
        padding: 0 3em;
    }
    dialog > section > div.footer
    {
        padding: 0 3em;
        margin: 0 auto;
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
    p
    {
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.3125rem;
        color: var(--tgc-light-gray);
        margin: 0;
        padding: 0;
    }
</style>
