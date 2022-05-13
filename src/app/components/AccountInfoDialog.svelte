<script lang="ts">
    import { ExplorerId } from "../../common/primitives";
    import { invoke } from "../common/ipc";
    
    let dialog;    
    let title;    
    let info;
   
    export function showDialog(accountId: string) {
        title = `Account ${accountId}`;
        info = null;
        invoke('get-account-info', accountId).then( value => info = value ); 
        dialog.showModal();
    }

    function onClose() {
        dialog.close();
    }

    function onOpenDragonglass() {
        invoke('open-account-explorer', info.accountId, ExplorerId.DragonGlass);
    }

    function onOpenHashScan() {
        invoke('open-account-explorer', info.accountId, ExplorerId.HashScan);
    }
</script>

<dialog bind:this={dialog}>
    <section>
        <button on:click={onClose} class="close-dialog"></button>                
        <h1>{title}</h1>
        <div>
            {#if info}                
                {#if info.timestamp}
                    <h2><span class="network">{info.network}</span> as of <i>{info.timestamp}</i></h2>
                {:else}
                    <h2><span class="network">{info.network}</span></h2>
                {/if}
                {#if info.error}
                    <div>{info.error}</div>
                {:else}
                    {#if info.balance}
                        <div>Crypto <i>(tℏ)</i> {info.balance}</div>
                    {:else}
                        <div>No crypto balance</div>
                    {/if}
                    {#each info.tokens as {token_id, balance}}
                        <div>Token <i>{token_id}</i> {balance}</div>
                    {/each}
                {/if}
                <div class="lookup">More info on</div>
                <ul>
                    <li on:click={onOpenDragonglass}>DragonGlass</li>
                    <li on:click={onOpenHashScan}>HashScan</li>
                </ul>
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
        padding: 0;
        width: min(90vw, 28rem);
        min-height: 17rem;
        color: var(--cds-nl-0);
    }
    dialog > section > div {
        padding: 0 3rem;
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
        cursor: pointer;
    }
    li:active, li:focus, li:hover {
        color: var(--cds-cs-500);
        text-decoration: underline;
    }
</style>
