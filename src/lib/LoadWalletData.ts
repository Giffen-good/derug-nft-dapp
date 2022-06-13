import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as _ from 'lodash';

import { Mint, Metadata, MetadataURL, MetadataAddress } from './Types';
import {
    METADATA_ADDRESS_BATCH_SIZE,
    METADATA_ACCOUNT_BATCH_SIZE,
    METADATA_URL_BATCH_SIZE,
    CORS_PROXY,
    WRAPPED_SOL,
} from './Constants';
import { decodeMetadata } from './metaplex/metadata';
import { fetchWithRetry } from './utilities';
import React from "react";

/* Some inspiration taken from
 * https://github.com/NftEyez/sol-rayz/blob/main/packages/sol-rayz/src/getParsedNftAccountsByOwner.ts */
export async function getTokenAccounts(connection: Connection, publicKey: PublicKey): Promise<Mint[]> {
    while (true) {
        try {
            console.log(`Fetching token accounts...`);

            const { value } = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID },
            );

            const nftAccounts = value.filter(({ account }) => {
                const amount = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
                return amount > 0 && account.data.parsed.info.mint !== WRAPPED_SOL;
            }).map(({ account, pubkey }) => {
                const amounts = account?.data?.parsed?.info?.tokenAmount;

                return {
                    mint: account.data.parsed.info.mint,
                    tokenAcc: pubkey,
                    count: Number(amounts.amount),
                    uiAmount: Number(amounts.uiAmount),
                    markForBurn: false,
                    burnt: false,
                };
            });

            console.log(`Fetched ${nftAccounts.length} valid token accounts...`);

            return nftAccounts;
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}

export async function getMetadataAddresses(
    connection: Connection,
    tokenMints: Mint[]) {

    let addresses: any[] = [];

    for (let i = 0; i < tokenMints.length / METADATA_ADDRESS_BATCH_SIZE; i++) {
        const itemsRemaining = Math.min(METADATA_ADDRESS_BATCH_SIZE, tokenMints.length - i * METADATA_ADDRESS_BATCH_SIZE);

        const processing: any[] = [];

        for (let j = 0; j < itemsRemaining; j++) {
            const item = i * METADATA_ADDRESS_BATCH_SIZE + j;

            const mint = tokenMints[item];

            processing.push(getMetadataAddress(mint));
        }

        const results = await Promise.allSettled(processing);

        const successful = results.filter((res) => {
            return res.status === 'fulfilled';
            // eslint-disable-next-line no-loop-func
        }).map((res) => {
            return (res as PromiseFulfilledResult<any>).value;
        });

        addresses = addresses.concat(successful);
    }

    return addresses;
}

const metadataProgram = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

async function getMetadataAddress(mint: Mint): Promise<MetadataAddress> {
    const address = (await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                metadataProgram.toBuffer(),
                new PublicKey(mint.mint).toBuffer(),
            ],
            metadataProgram,
        )
    )[0];

    return {
        ...mint,
        metadataAddress: address,
    };
}

async function getMetadataAccountChunk(
    connection: Connection,
    addresses: MetadataAddress[],
    setStatusText: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<MetadataURL[]> {
    const mintMap = new Map();

    for (const address of addresses) {
        mintMap.set(address.mint, {
            tokenAcc: address.tokenAcc,
            count: address.count,
            uiAmount: address.uiAmount,
        });
    }

    while (true) {
        try {
            console.log(`Fetching on chain metadata accounts...`);

            const results = await connection.getMultipleAccountsInfo(addresses.map((a) => a.metadataAddress));

            const metadata = [];

            for (const meta of results) {
                if (meta) {
                    try {
                        const result = decodeMetadata(meta.data);

                        const {
                            tokenAcc,
                            count,
                            uiAmount,
                        } = mintMap.get(result.mint);

                        metadata.push({
                            mint: result.mint,
                            url: result.data.uri,
                            tokenAcc,
                            count,
                            markForBurn: false,
                            burnt: false,
                            uiAmount,
                            name: result.data.name,
                            symbol: result.data.symbol,
                        });

                        setStatusText(`Loaded ${result.data.name} account...`);
                    } catch (err) {
                        console.log(err);
                        continue;
                    }
                }
            }

            return metadata;
        } catch (err) {
            console.log(err);
            continue;
        }
    }
}

export async function getMetadataAccounts(
    connection: Connection,
    metadataAddresses: MetadataAddress[],
    setStatusText: React.Dispatch<React.SetStateAction<string | null>>,
) {
    const addresses = _.chunk(metadataAddresses, 20);

    let accounts: MetadataURL[] = [];

    for (let i = 0; i < addresses.length / METADATA_ACCOUNT_BATCH_SIZE; i++) {
        const itemsRemaining = Math.min(METADATA_ACCOUNT_BATCH_SIZE, addresses.length - i * METADATA_ACCOUNT_BATCH_SIZE);

        const processing: any[] = [];

        for (let j = 0; j < itemsRemaining; j++) {
            const item = i * METADATA_ACCOUNT_BATCH_SIZE + j;

            const chunk = addresses[item];

            processing.push(getMetadataAccountChunk(connection, chunk, setStatusText));
        }

        const results = await Promise.allSettled(processing);

        const successful = results.filter((res) => {
            return res.status === 'fulfilled';
            // eslint-disable-next-line no-loop-func
        }).map((res) => {
            return (res as PromiseFulfilledResult<any>).value;
        });

        for (const result of successful) {
            for (const metadata of result) {
                accounts.push(metadata);
            }
        }
    }

    return accounts;
}

async function fetchMetadataURL(
    url: MetadataURL,
    setStatusText: React.Dispatch<React.SetStateAction<string | null>>,
    setNftsLoaded: React.Dispatch<React.SetStateAction<number>>,
): Promise<{ success: boolean, data: MetadataURL }> {
    console.log(`Fetching metadata for ${url.mint}, URL: ${url.url}...`);

    if (!url.url) {
        return { success: false, data: {
                mint: url.mint,
                count: url.count,
                tokenAcc: url.tokenAcc,
                name: url.name,
                symbol: url.symbol,
                markForBurn: false,
                uiAmount: url.uiAmount,
                burnt: false,
            }};
    }

    let endpoint = CORS_PROXY + url.url;

    const validEndpoints = [
        'arweave.net',
        'https://testlaunchmynft',
        'ipfs.dweb.link',
    ];

    for (const permitted of validEndpoints) {
        if (url.url.includes(permitted)) {
            endpoint = url.url;
            break;
        }
    }

    if (url.url !== endpoint) {
        console.log(`Non arweave URL: ${url.url}`);
    }

    const {
        success,
        data,
        error,
    } = await fetchWithRetry(
        endpoint,
    );

    if (success && data) {
        console.log(`Successfully fetched metadata for ${data.name}...`);

        setStatusText(`Loaded ${data.name} metadata...`);
        setNftsLoaded((c) => c+1);

        return {
            success: true,
            data: {
                mint: url.mint,
                count: url.count,
                tokenAcc: url.tokenAcc,
                name: url.name,
                symbol: url.symbol,
                markForBurn: false,
                uiAmount: url.uiAmount,
                ...data,
            },
        };
    } else if (error) {
        console.log(`Failed to fetch metadata for ${url.mint}: ${error.toString()}`);
    }

    return { success: false, data: {
            mint: url.mint,
            count: url.count,
            tokenAcc: url.tokenAcc,
            name: url.name,
            symbol: url.symbol,
            markForBurn: false,
            burnt: false,
            uiAmount: url.uiAmount,
        }};
}

function sortMetadata(a: Metadata, b: Metadata) {
    if (!a.collection || !a.collection.name) {
        return 1;
    }

    if (!b.collection || !b.collection.name) {
        return -1;
    }

    if (a.collection.name !== b.collection.name) {
        return a.collection.name.localeCompare(b.collection.name);
    }

    return a.name.localeCompare(b.name);
}

export async function getMetadata(
    metadataURLs: MetadataURL[],
    setStatusText: React.Dispatch<React.SetStateAction<string | null>>,
    setNftsLoaded: React.Dispatch<React.SetStateAction<number>>,
) {
    let metadata: Metadata[] = [];
    const tokens = [];

    for (let i = 0; i < metadataURLs.length / METADATA_URL_BATCH_SIZE; i++) {
        const itemsRemaining = Math.min(METADATA_URL_BATCH_SIZE, metadataURLs.length - i * METADATA_URL_BATCH_SIZE);

        const processing: any[] = [];

        for (let j = 0; j < itemsRemaining; j++) {
            const item = i * METADATA_URL_BATCH_SIZE + j;

            const url = metadataURLs[item];

            processing.push(fetchMetadataURL(url, setStatusText, setNftsLoaded));
        }

        const results = await Promise.allSettled(processing);

        console.log(`Got ${results.length} results`);

        const successful = results.filter((res) => {
            if (res.status !== 'fulfilled') {
                console.log(res.reason);
            }

            return res.status === 'fulfilled';
            // eslint-disable-next-line no-loop-func
        }).map((res) => {
            return (res as PromiseFulfilledResult<any>).value;
        });

        for (const result of successful) {
            if (result.success) {
                metadata.push(result.data);
            } else {
                tokens.push(result.data);
            }
        }
    }

    return {
        nfts: metadata.sort(sortMetadata),
        tokens,
    };
}
