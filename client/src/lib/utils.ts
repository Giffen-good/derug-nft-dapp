import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as _ from 'lodash';

import { Mint, MetadataURL, MetadataAddress } from './Types';
import {
    METADATA_ADDRESS_BATCH_SIZE,
    METADATA_ACCOUNT_BATCH_SIZE,
    WRAPPED_SOL, API_URL, METADATA_PROGRAM,
} from './Constants';
import { decodeMetadata } from './metaplex/metadata';
import React from "react";
import axios from "axios";


/* Some inspiration taken from
 * https://github.com/NftEyez/sol-rayz/blob/main/packages/sol-rayz/src/getParsedNftAccountsByOwner.ts */
export async function getTokenAccounts(connection: Connection, publicKey: PublicKey): Promise<Mint[]> {
    const isMemberOfCollection = (mintAddress: string, hashlist: string[] ): Boolean => {
        return hashlist.includes(mintAddress)
    }
    const hashlist = await getHashlist();
    while (true) {
        try {
            console.log(`Fetching token accounts...`);

            const { value } = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID },
            );

            const nftAccounts = value.filter(({ account }) => {
                const amount = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
                const inCollection = isMemberOfCollection(account.data.parsed.info.mint, hashlist)
                return amount > 0 && account.data.parsed.info.mint !== WRAPPED_SOL && inCollection;
            }).map(({ account, pubkey }) => {
                const amounts = account?.data?.parsed?.info?.tokenAmount;

                return {
                    mint: account.data.parsed.info.mint,
                    tokenAcc: pubkey,
                    count: Number(amounts.amount),
                    uiAmount: Number(amounts.uiAmount),
                    markForBurn: true,
                    burnt: false
                };
            });

            console.log(`Fetched ${nftAccounts.length} valid token accounts...`);

            return nftAccounts;
        } catch (err) {
            console.log(err);
        }
    }
}
export async function getHashlist(): Promise<string[]> {
    try {
        const { data } = await axios.get(API_URL + '/getMintList');
        return data.hashlist;
    } catch (error) {
        console.log(error)
        return []
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


async function getMetadataAddress(mint: Mint): Promise<MetadataAddress> {
    const address = (await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                METADATA_PROGRAM.toBuffer(),
                new PublicKey(mint.mint).toBuffer(),
            ],
            METADATA_PROGRAM,
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
                            markForBurn: true,
                            burnt: false,
                            uiAmount,
                            name: result.data.name,
                            symbol: result.data.symbol
                        });

                        setStatusText(`Loaded ${result.data.name} account...`);
                    } catch (err) {
                        console.log(err);
                    }
                }
            }

            return metadata;
        } catch (err) {
            console.log(err);
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
