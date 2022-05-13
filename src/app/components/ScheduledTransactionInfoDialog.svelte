<script lang="ts">
    import { displayEpochString } from "../../common/convert";
    import { ExplorerId } from "../../common/primitives";
    import { invoke } from "../common/ipc";
    
    let dialog;    
    let title;    
    let info;
   
    export function showDialog(scheduleId: string, scheduledTx: string) {
        title = `Distribution Transaction ${scheduledTx}`;
        info = null;
        invoke('get-schedule-info', scheduleId).then( scheduleInfo => {
            if(scheduleInfo.error) {
                info = { error: scheduleInfo.error, network: scheduleInfo.network };
            } else if(scheduleInfo.executed) {
                const [accountId, timestampWithFlags] = scheduledTx.split('@');
                const [timestamp, scheduled] = timestampWithFlags.split('?');
                const [secondsString, nanosString] = timestamp.split('.');
                const seconds = parseInt(secondsString,10);
                const nanos = parseInt(nanosString,10);
                invoke('get-transaction-info', accountId, seconds, nanos, true).then( value => info = value );
            } else {
                info = { 
                    error: `Distribution ${scheduleId} is awaiting additional countersignatures and has not been completed, there is no transaction to review.`,
                    network: scheduleInfo.network
                };
            }
        } ); 
        dialog.showModal();
    }

    function onClose() {
        dialog.close();
    }

    function onOpenDragonglass() {
        invoke('open-transaction-explorer', info.txId, ExplorerId.DragonGlass);
    }

    function onOpenHashScan() {
        invoke('open-transaction-explorer', info.txId, ExplorerId.HashScan);
    }
</script>

<dialog bind:this={dialog}>
    <section>
        <button on:click={onClose} class="close-dialog"></button>                
        <h1>{title}</h1>
        <div>
            {#if info}                
                <h2><span class="network">{info.network}</span></h2>
                {#if info.error}
                    <div>{info.error}</div>
                {:else}
                    <div>{displayEpochString(info.consensus_timestamp)}</div>
                    <div>{info.name}</div>
                    <div>{info.result}</div>                    
                    <div class="lookup">More info on</div>
                    <ul>
                        <li on:click={onOpenDragonglass}>DragonGlass</li>
                        <li on:click={onOpenHashScan}>HashScan</li>
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
        padding: 0;
        width: min(90vw, 36rem);
        min-height: 17rem;
        color: var(--cds-nl-0);
    }
    dialog > section > div {
        padding: 0 3rem 1rem 3rem;
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
