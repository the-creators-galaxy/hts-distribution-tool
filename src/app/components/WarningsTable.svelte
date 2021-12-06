<script lang="ts">
    export let warnings:string[];    
</script>
<div class="container">
{#if warnings && warnings.length > 0}
    <div>Warnings</div>
    <ul>
        {#each warnings as item}
            <li>{item}</li>
        {/each}
    </ul>
{:else}
    <div>No Warnings found.</div>
    <ul></ul>
{/if}
</div>

<style>
    div.container {
        overflow: hidden;
        display: grid;
        grid-template-rows: max-content 1fr;
        border: 1px solid var(--tcg-dark-gray2);
        background-color: var(--tcg-transparent-black);
        border-radius: 0.75rem;  
        align-self:start;
        max-height: 100%;
    }
    ul {        
        overflow-x: hidden;
        overflow-y: auto;
        font-size: 0.875rem;
        margin-bottom: 1.25rem;
        margin: 0;
        padding: 0.75rem 1.5rem 1.5rem 3rem;
        user-select: text;
        border-top: 1px solid var(--tcg-dark-gray2);
        font-size: 0.875rem;
    }
    li {
        margin: 0;
        padding: 0;
        line-height: 1.3125rem;
    }
    div.container > div
    {        
        color: var(--tcg-yellow);
        font-size: 1rem;
        margin: 0 0 1.375rem 0;
        margin: 0;
        padding: 0.625rem 1.5rem;
        font-size: 0.875rem;
    }
</style>
