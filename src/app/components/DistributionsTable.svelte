<script lang="ts">
import { PaymentStage, PaymentStep } from "../../common/primitives";

    import { invoke } from "../common/ipc";

    export let payments: any[];

    // this is a little more complex than otherwise
    // would usually create, we don't have to have 
    // click handler registrations for each row in 
    // the table, we wrap it up to one handler so the
    // dom can render with less complication.
    async function handleClick(evt) {
        for(let element = evt.target; element; element = element.parentElement) {
            const cellType = element.dataset.celltype;
            if(cellType) {
                evt.preventDefault();
                const index = element.parentElement.dataset.rowno;
                if(index) {
                    const payment = payments[index-1];
                    if(payment) {
                        if(cellType === 'address') {
                            await invoke('open-address-explorer',payment.account);
                        } else if(cellType === 'schedule') {
                            await invoke('open-address-explorer',payment.scheduleId);
                        } else if(cellType === 'scheduling-tx') {
                            await invoke('open-transaction-explorer', payment.schedulingTx);
                        } else if(cellType === 'scheduled-tx') {
                            await invoke('open-scheduled-transaction-explorer', payment.scheduleId);
                        }
                    }
                }
            }
        }
    }

    function getStatusText(stage, step) {
        switch(stage) {
            case PaymentStage.Processing:
                switch(step){
                    case PaymentStep.Scheduling: return 'Processing: Scheduling';
                    case PaymentStep.Countersigning: return 'Processing: Countersigning';
                    case PaymentStep.Confirming: return 'Processing: Confirming';
                    case PaymentStep.Finished: return 'Processing: Finished';
                }
                return 'Processing';
            case PaymentStage.Scheduled: return 'Scheduled';
            case PaymentStage.Completed: return 'Completed';
            case PaymentStage.Failed: return 'Failed';
        }
        return 'Not Started';
    }

</script>

<div class="container" on:click={handleClick}>
    <table>
        <tr>
            <th>No.</th>
            <th>Account</th>
            <th>Amount</th>
            <th>Distribution ID</th>
            <th>Distribution Status</th>
            <th>Scheduling Transaction</th>
            <th>Distribution Transaction</th>
        </tr>
        {#each payments as { index, account, amount, stage, step, schedulingTx, scheduledTx, scheduleId }, rowNo}
        <tr data-rowno={rowNo+1}>
            <td>{index}</td>
            <td data-celltype="address">{account}</td>
            <td>{amount}</td>
            {#if scheduleId}
                <td data-celltype="schedule">{scheduleId}</td>
            {:else}
                <td></td>
            {/if}
            <td>{getStatusText(stage,step)}</td>
            {#if schedulingTx}
                <td data-celltype="scheduling-tx">{schedulingTx}</td>
            {:else}
                <td></td>
            {/if}
            {#if scheduledTx}
                <td data-celltype="scheduled-tx">{scheduledTx}</td>
            {:else}
                <td></td>
            {/if}
        </tr>
        {/each}
    </table>
</div>
<style>
    div.container {
        margin: 0;
        padding: 0;
		display: grid;	
		align-content: start;
		overflow: auto;	
        background-color: var(--cds-nd-0-40);
    }
    table {
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 0.75rem;
        border: 1px solid var(--cds-nd-700);
        user-select: text;
        font-size: 0.75rem;
        line-height: 1rem;
        color: var(--cds-nl-0);
    }
    th {        
        text-align: left;
        padding: 0.75rem;
        color: var(--cds-cs-500);
    }
    th + th {
        border-left: 1px solid var(--cds-nd-700);
    }
	th:nth-child(1) {
		min-width: 3em;
	}
	th:nth-child(2) {
		min-width: 6em;
	}
	th:nth-child(3) {
		min-width: 6em;
	}
	th:nth-child(4) {
		min-width: 7em;
	}
	th:nth-child(5) {
		min-width: 12em;
	}
	th:nth-child(6) {
		min-width: 18em;
	}
	th:nth-child(7) {
		min-width: 24em;
	}    
    td {
        margin: 0;
        padding: 0.125rem 0.75rem;
        border-top: 1px solid var(--cds-nd-700);
    }
    td + td
    {
        border-left: 1px solid var(--cds-nd-700);
    }
    td[data-celltype] {
        cursor: pointer;
    }
    td[data-celltype]:hover {
        color: var(--cds-cs-500);
        text-decoration: underline;
    }
</style>
