<script lang="ts">

    let dialog;
    export let title = "Information";
   
    function onShow() {
        dialog.showModal();
    }
    function onClose() {
        dialog.close();
    }
</script>

<div class="tcg-info-icon" on:click={onShow}></div>
<dialog bind:this={dialog}>
    <section>
        <button on:click={onClose} class="close-dialog"></button>
        <h1>{title}</h1>
        <div class="content">
            <slot></slot>
        </div>
    </section>
</dialog>

<style>
    dialog > section {
        display: grid;
        grid-template-rows: max-content max-content 1fr;
        margin: 0;
        padding: 0;
        width: min(90vw, 28rem);
        min-height: 17rem;
    }
    h1 {
        margin: 0 3rem;
        padding: 0;
        font-weight: 600;
        font-size: 1.25rem;
    }
    div.content {
        color: var(--cds-nl-0);
        font-weight: 200;
        font-size: 1rem;
        line-height: 1.5;
        margin: 0;
        padding: 1rem 3rem;
        overflow-x: hidden;
        overflow-y: auto;
    }
    button.close-dialog {
        justify-self: end;        
        margin: 1rem 1rem 0 0;
    }
    div.tcg-info-icon {
        display: inline-block;
        cursor: pointer;
        width: 1rem;        
        vertical-align: middle;
    }
</style>
