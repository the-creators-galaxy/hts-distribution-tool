## Title

Hedera Token Service Distribution Tool

## Description

This is a developer tool utilized to facilitate the distribution of tokens that have been created on the [Hedera Token Service](https://hedera.com/token-service) (HTS). While specifically created for use within [The Creator's Galaxy](https://creatorsgalaxyfoundation.com/whitepaper.pdf) and it's native token, $CLXY, it can be utilized by any project wishing to manage assets on the Hedera network, facilitate airdrops, giveaways, and more, leveraging the network's native [multi-signature accounts](https://docs.hedera.com/guides/core-concepts/keys-and-signatures) and [scheduled transactions](https://docs.hedera.com/guides/core-concepts/scheduled-transaction).

### Disclaimer

> This is alpha software. It has not been audited. *Use at your own risk.*

## Technologies

- [TypeScript](https://www.typescriptlang.org)
- [Node.js](https://nodejs.org/en/)
- [Hedera's JavaScript SDK](https://github.com/hashgraph/hedera-sdk-js)
- [Electron](https://www.electronjs.org)
- [Svelte](https://svelte.dev)
- [csv-reader](https://www.npmjs.com/package/csv-reader)
- [rollup.js](https://rollupjs.org/guide/en/)
- [prettier](https://prettier.io)

## Getting started

#### Installation

1. `git clone https://github.com/the-creators-galaxy/hts-distribution-tool.git`
2. `cd hts-distribution-tool`
3. `npm install`

#### Running the project

`npm run dev`

#### Testing

`npm run test`

`npm run test:unit`

`npm run test:integration`

#### Formatting

`npm run format`

## Deployment

#### Staging

There is no staging environment for this project, as it's intended to be run locally.

#### Production

There is no production environment for this project, as it's intended to be run locally.

With enough community interest, we could consider distributing as a desktop application.

## How it works

This tool reads in a `.csv` file of Hedera accounts & distribution quantities for a specific HTS token, then generates [scheduled transcations](https://docs.hedera.com/guides/core-concepts/scheduled-transaction) on the [Hedera network](https://hedera.com) of your choice. These scheduled transactions need to be countersigned by the number of signatures defined by the Hedera account holding tokens that are intended to be moved. For example, an account acting as a treasury can be created with a 2/3 [threshold key schema](https://docs.hedera.com/guides/core-concepts/keys-and-signatures), and thus in this case 2 different parties would need to run this tool with the same `.csv` input to coordinate tx-signing collectively. Transactions can be verified on an independent network explorer such as [DragonGlass](https://testnet.dragonglass.me/hedera/home) or [Kabuto](https://explorer.kabuto.sh/testnet).

## Authors

[Jason Fabritz](mailto:jason@calaxy.com)

## License

[MIT](/LICENSE)