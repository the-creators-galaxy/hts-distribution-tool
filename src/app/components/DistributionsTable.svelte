<script lang="ts">
    export let payments: any[];
</script>

<div class="container">
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
        {#each payments as { index, account, amount, status, schedulingTx, scheduledTx, scheduleId }}
        <tr>
            <td>{index}</td>
            <td>{account}</td>
            <td>{amount}</td>
            <td>{scheduleId || ''}</td>
            <td>{status || ''}</td>
            <td>{schedulingTx || ''}</td>
            <td>{scheduledTx || ''}</td>
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
        background-color: var(--tcg-transparent-black);
    }
    table {
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 0.75rem;
        border: 1px solid var(--tcg-dark-gray2);
        user-select: text;
        font-size: 0.75rem;
        line-height: 1rem;
        color: var(--tcg-white);
    }
    th {        
        text-align: left;
        padding: 0.75rem;
        color: var(--tcg-green);
    }
    th + th {
        border-left: 1px solid var(--tcg-dark-gray2);
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
		min-width: 22em;
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
        border-top: 1px solid var(--tcg-dark-gray2);
    }
    td + td
    {
        border-left: 1px solid var(--tcg-dark-gray2);
    }
</style>
