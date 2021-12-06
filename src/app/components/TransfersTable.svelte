<script lang="ts">
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

</script>
<div class="container">
    <div class="headers">
        <div>Account</div>
        <div>Amount</div>
    </div>
    <div class="data">
        {#each data as { shard, realm, num, whole, fraction }}
        <div class="account"><span class="shard">{shard}.</span><span class="realm">{realm}.</span><span class="num">{num}</span></div>
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
        border: 1px solid var(--tcg-dark-gray2);
        /* This is causing a visual bug with the rows of text apperaing above the sticky header */
        /* padding-top: 1px; */
        user-select: text;
        background-color: var(--tcg-transparent-black);
    }
    div.headers 
    {
        position: sticky;
        top: -1px;
        color: var(--tcg-green);
        display: grid;
        grid-template-columns: 1fr 1fr;
        justify-content: start;
        font-weight: 500;
        background: var(--tcg-black);
        border-bottom: 1px solid var(--tcg-dark-gray2);
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
        border-left: 1px solid var(--tcg-dark-gray2);
    }
    div.data 
    {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    div.data > div
    {
        padding: 0.25rem 1.5rem;
        border-bottom: 1px solid var(--tcg-dark-gray2);
    }
    div.data > div.amount
    {
        border-left: 1px solid var(--tcg-dark-gray2);
    }
    span.shard, span.realm, span.fraction
    {
        opacity: 0.6;
    }
</style>
