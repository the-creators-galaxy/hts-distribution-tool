<script lang="ts">
    export let data:string[][];
    export let columns: number;
</script>

<table>
{#each data as row, i}
<tr>
    <td class="rowno">{i+1}</td>
    {#if row.length === 1}
        <td colspan={columns}>{row[0]}</td>
    {:else if row.length === 0}
        <td colspan={columns}>&nbsp;</td>
    {:else}
        {#each row as cell}
            <td>{cell}</td>
        {/each}
        {#if row.length < columns}
            <td colspan={columns - row.length}></td>
        {/if}
    {/if}
</tr>
{/each}
</table>

<style>
    table {
        display: block;
        height: 100%;
        width: 100%;
        border-collapse: collapse;
        overflow: auto;
        border-radius: 0.75rem;
        border: 1px solid var(--cds-nd-700);
        background-color: var(--cds-nd-0-40);
        user-select: text;
    }
   	td {
        margin: 0;
        padding: 0.2rem 1rem;
        border: 1px solid var(--cds-nd-700);
	}
    td.rowno {
        font-size: 0.8rem;
        vertical-align: middle;
        border: none;
        text-align: end;
        padding-right: 0.4rem;
        opacity: 0.5;

    }
</style>
