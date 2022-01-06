<script lang="ts">
    export let pageSize = 100;
    export let pageNumber = 1;    
    export let allData = [];
    export let pagedData = [];

    $: itemsCount = allData?.length || 0;
    $: pageCount = itemsCount > 0 ? Math.trunc(itemsCount / pageSize) + 1 : 1;
    $: pageIndexStart = (pageNumber - 1) * pageSize;
    $: pageIndexEnd = Math.min(pageIndexStart + pageSize, itemsCount);
    $: pagedData = allData ? allData.filter((_,i)=> i >= pageIndexStart && i < pageIndexEnd): [];

    function previousPage() {
        if(pageNumber > 1) {
            pageNumber = pageNumber - 1;
        }
    }

    function nextPage() {
        if(pageNumber * pageSize < itemsCount) {
            pageNumber = pageNumber + 1;
        }
    }

</script>

<div>
    {#if pageCount > 1}
    {pageIndexStart + 1} - {pageIndexEnd} <button on:click={previousPage} disabled={pageNumber < 2} class="left-arrow"></button> {pageNumber} of {pageCount} <button on:click={nextPage} disabled={pageNumber >= pageCount} class="right-arrow"></button>
    {/if}
</div>

<style>
    div {
        display: grid;   
        grid-template-columns: max-content max-content max-content max-content;     
        align-items: center;
        column-gap: 1rem;
        vertical-align: middle;
        font-size: 0.875rem;
        color: var(--cds-nl-0);
        margin-left: auto;
    }
</style>
