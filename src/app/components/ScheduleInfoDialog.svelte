<script lang="ts">
    import { invoke } from "../common/ipc";
    
    let dialog;    
    let title;    
    let info;
    let showJson;
   
    export function showDialog(scheduleId: string) {
        title = `Schedule ${scheduleId}`;
        info = null;
        showJson = false;
        invoke('get-schedule-info', scheduleId).then( value => info = value ); 
        dialog.showModal();
    }

    function onClose() {
        dialog.close();
    }

    function onShowJson() {
        showJson = true;
    }

    function onShowDetails() {
        showJson = false;
    }    
</script>

<dialog bind:this={dialog}>
    <section>
        <button on:click={onClose} class="close-dialog"></button>                
        <h1>{title}</h1>
        <div>
            {#if info && showJson}         
                <div class="json">{JSON.stringify(info.raw,null,2)}</div>
                <div class="action" on:click={onShowDetails}>Show Summary</div>
            {:else if info}                
                <h2><span class="network">{info.network}</span></h2>
                {#if info.error}
                    <div>{info.error}</div>
                {:else}
                    <div>Created on <i>{info.timestamp}</i> by {info.createdById}</div>
                    <div>Paying account {info.payerId}</div>
                    {#if info.executed}
                        <div>Completed on <i>{info.executed}</i></div>
                    {:else}
                        <div>Not Completed, Signed By</div>
                        <ul>
                            {#each info.signingKeys as key}
                                <li>{key}</li>
                            {/each}
                        </ul>
                    {/if}
                {/if}
                {#if info.raw}
                    <div class="lookup">More info</div>
                    <ul>
                        <li class="action" on:click={onShowJson}>Show Mirror JSON</li>
                    </ul>
                {/if}
            {:else}
                <div>Retrieving current info ...</div>
            {/if}
        </div>
    </section>
</dialog>

<style>
    dialog > section {
        display: grid;
        grid-template-rows: max-content max-content 1fr;
        margin: 0;
        padding: 0 0 1rem 0;
        width: min(90vw, 28rem);
        min-height: 17rem;
        color: var(--cds-nl-0);
    }
    dialog > section > div {
        padding: 0 3rem 1rem 3rem;
        overflow-x: hidden;
        overflow-y: auto;
    }
    h1 {
        margin: 0 3rem;
        padding: 0;
        font-weight: 600;
        font-size: 1.25rem;
    }
    h2 {
        margin: 0 0 1rem 0;
        padding: 0;
        font-weight: 300;
        font-size: 1rem;
        line-height: 1;
    }
    button.close-dialog {
        justify-self: end;        
        margin: 1rem 1rem 0 0;
    }
	.network, i {
		color: var(--cds-cs-500);
	}
    .lookup {
        margin-top: 1rem;
    }
    ul {
        margin: 0;
    }
    li {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .action {
        cursor: pointer;
    }
    .action:active, .action:focus, .action:hover {
        color: var(--cds-cs-500);
        text-decoration: underline;
    }
    .json {
        white-space: pre;
        overflow-y: auto;
    }
</style>
