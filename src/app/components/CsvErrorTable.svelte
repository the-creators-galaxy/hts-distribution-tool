<script lang="ts">
    import type { CsvParseError } from "../../common/primitives";

    export let errors:CsvParseError[];    

</script>
<div class="container">
{#if errors && errors.length > 0}
    <div class="tcg-danger-icon"></div>
    <div class="error-message">Errors in file, please correct the problems and try again.</div>
    <div class="list">
        <div class="header row">Row</div>
        <div class="header col">Col</div>
        <div class="header desc">Description</div>
        {#each errors as {line, column, description}}
        <div class="row">{line}</div>
        <div class="col">{column}</div>
        <div class="desc">{description}</div>
        {/each}    
    </div>
{:else}
    <p>No Errors found.</p>
{/if}
</div>

<style>
    div.container {
        overflow: hidden;
        display: grid;
        grid-template-rows: max-content max-content 1fr;
        align-self:start;
        max-height: 100%;
        background-color: var(--tcg-transparent-black);
    }
    div.list {
        overflow: auto;
        display: grid;
        grid-template-columns: max-content max-content 1fr;
        align-content: start;
        position: relative;
        font-size: 0.875rem;
        border-radius: 0.75rem;
        border: 1px solid var(--tcg-dark-gray2);
        margin-bottom: 1.25rem;
        padding-top: 1px;
        user-select: text;
    }
    div.list div
    {
        padding: 0.25rem 1.5rem;
        border-bottom: 1px solid var(--tcg-dark-gray2);
    }
    div.row
    {
        text-align: right;
    }
    div.col
    {
        text-align: right;
        border-left: 1px solid var(--tcg-dark-gray2);
    }
    div.desc
    {
        border-left: 1px solid var(--tcg-dark-gray2);
    }
    div.header 
    {
        position: sticky;
        top: -1px;
        color: var(--tcg-green);
        display: grid;
        grid-template-columns: 1fr 1fr;
        font-weight: 500;
        background: var(--tcg-black);
        margin-top: -1px;
        z-index: 1;
        padding: 0.75rem 1.5rem;
    }
    div.error-message 
    {        
        color: var(--tcg-red);
        font-size: 1rem;
        text-align: center;
        margin: 0 0 1.375rem 0;
    }
    div.tcg-danger-icon 
    {
        margin: 0 auto;
    }
    p
    {
        margin: 1rem auto;
    }
</style>
