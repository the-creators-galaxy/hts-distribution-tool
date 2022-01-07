<script lang="ts">
import { invoke } from "../common/ipc";


  	export let transfers: { account:string, amount: string }[];
    export let decimals: number = 0;  

    $: data = transfers.map(t => { 
        const [shard, realm, num] = t.account.split('.');
        let amountParts = t.amount.split('.');
        return { 
            shard,
            realm,
            num,
            whole: amountParts[0],
            fraction: (amountParts[1] || '0').padEnd(decimals,'0')
        };
    });    

    // this is a little more complex than otherwise
    // would usually create, we don't have to have 
    // click handler registrations for each row in 
    // the table, we wrap it up to one handler so the
    // dom can render with less complication.
    async function handleClick(evt) {
        for(let element = evt.target; element; element = element.parentElement) {
            const index = element.dataset.account;
            if(index) {
                evt.preventDefault();
                const transfer = transfers[index-1];
                if(transfer) {
                    await invoke('open-address-explorer',transfer.account);
                }
            }
        }
    }

</script>
<div class="container" on:click={handleClick}>
    <div class="headers">
        <div>Account</div>
        <div>Amount</div>
    </div>
    <div class="data">
        {#each data as { shard, realm, num, whole, fraction }, index}
        <div class="account" data-account={index+1}><span class="shard">{shard}.</span><span class="realm">{realm}.</span><span class="num">{num}</span></div>
        <div class="amount"><span class="whole">{whole}</span><span class="fraction">.{fraction}</span></div>
        {/each}
    </div>
</div>

<style>
    div.container {
        overflow: auto;
        display: grid;
        grid-template-rows: max-content 1fr;
        align-content: start;
        align-self:start;
        max-height: 100%;
        position: relative;
        font-size: 0.875rem;
        border-radius: 0.75rem;
        border: 1px solid var(--cds-nd-700);
        /* This is causing a visual bug with the rows of text apperaing above the sticky header */
        /* padding-top: 1px; */
        user-select: text;
        background-color: var(--cds-nd-0-40);
    }
    div.headers 
    {
        position: sticky;
        top: -1px;
        color: var(--cds-cs-500);
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: start;
        font-weight: 500;
        background: var(--cds-nd-900);
        border-bottom: 1px solid var(--cds-nd-700);
        margin-top: -1px;
        z-index: 1;
    }
    div.headers > div
    {
        padding: 0.5rem 1.5rem;
        font-weight: 500;
    }
    div.headers > div:last-child
    {
        border-left: 1px solid var(--cds-nd-700);
    }
    div.data 
    {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    div.data > div
    {
        padding: 0.25rem 1.5rem;
        border-bottom: 1px solid var(--cds-nd-700);
    }
    div.data > div.account
    {
        cursor: pointer;
    }
    div.data > div.account:hover
    {
        color: var(--cds-cs-500);
        text-decoration: underline;
    }
    div.data > div.amount
    {
        border-left: 1px solid var(--cds-nd-700);
    }
    span.shard, span.realm, span.fraction
    {
        opacity: 0.6;
    }
</style>
