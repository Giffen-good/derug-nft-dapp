import React from 'react';
import * as _ from 'lodash';

import {
    Connection,
    Transaction,
    TransactionInstruction,
    PublicKey,

} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { TokenInfo } from '@solana/spl-token-registry';

import { RPC_URL } from '../lib/Constants';
import { Metadata, Mint, BurnMode, Burnable } from '../lib/Types';
import { NFTS_PER_PAGE, MAX_BURNS_PER_TX, INCINERATOR_ACCOUNT } from '../lib/Constants';
import {mintNFT} from "../lib/mintNFT";
import {
    getImage,
    getName,
} from '../lib/utilities';
import {NodeWallet} from "@metaplex/js";
import * as HASHLIST
    from "../map/fake-nft-hashmap_mainnet_fomo-bombs_8ih2rmb3zRKr7sjeo1BF3tUcybj8sw1zSpQjfZtNqRuZ.json";

export interface WalletContentProps {
    nfts: Burnable[];
    setNfts: React.Dispatch<React.SetStateAction<Metadata[] | Mint[]>>;
    tokenMap: Map<string, TokenInfo>;
    burnMode: BurnMode;
}

export interface BurnOverlayProps {
    toggleBurn: (x: any) => void;
    text: string;
    markForBurn: boolean;
    burnMode: BurnMode;
}

function getFontSize(name: string) {
    const len = name.length;

    if (len < 10) {
        return '26px';
    }

    if (len < 15) {
        return '23px';
    }

    if (len < 18) {
        return '21px';
    }

    if (len < 20) {
        return '19px';
    }

    if (len < 25) {
        return '18px';
    }

    if (len < 30) {
        return '17px';
    }

    if (len < 40) {
        return '16px';
    }

    if (len < 60) {
        return '15px';
    }

    return '5px';
}

function BurnOverlay(props: BurnOverlayProps) {
    const {
        toggleBurn,
        text,
        markForBurn,
        burnMode,
    } = props;

    return (
        <div
            onClick={toggleBurn}
        >
            <span>
                {text}
            </span>
        </div>
    );
}

export function WalletContents(props: WalletContentProps) {
    const {
        nfts,
        setNfts,
        tokenMap,
        burnMode,
    } = props;
    const [page, setPage] = React.useState<number>(0);
    const [burning, setBurning] = React.useState<boolean>(false);
    const [statusMessage, setStatusMessage] = React.useState<string>('');
    const [acceptedDisclaimer, setAcceptedDisclaimer] = React.useState<boolean>(false);

    const {
        publicKey,
        signAllTransactions
    } = useWallet();

    const pages = React.useMemo(() => {
        return _.chunk(nfts, NFTS_PER_PAGE);
    }, [nfts]);

    const burningNfts = React.useMemo(() => {
        return nfts.filter((n) => n.markForBurn);
    }, [nfts]);

    const burnCount = React.useMemo(() => burningNfts.length, [burningNfts]);

    const pageCount = React.useMemo(() => pages.length, [pages]);

    React.useEffect(() => {
        setPage(0);
    }, [pageCount]);

    React.useEffect(() => {
        onBurnComplete();
    }, [burnMode]);

    function markForBurn(mint: string, burn: boolean, e: React.MouseEvent<HTMLDivElement>) {
        e.stopPropagation();

        if (burning) {
            return;
        }

        const newNfts = _.cloneDeep(nfts);

        for (const nft of newNfts) {
            if (nft.mint === mint) {
                nft.markForBurn = burn;
            }
        }

        setNfts(newNfts);
    }

    function changePage(pages: number) {
        setPage((currentPage) => {
            if (currentPage + pages < 0) {
                return currentPage;
            }

            if (currentPage + pages >= pageCount) {
                return currentPage;
            }

            return currentPage + pages;
        });
    }

    function createCloseAccountInstruction(nft: Burnable) {
        const keys = [
            {
                pubkey: nft.tokenAcc,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: publicKey as PublicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: publicKey as PublicKey,
                isSigner: true,
                isWritable: false,
            },
            {
                /* This address is not used for anything - just for identifying our burn transactions in the API */
                pubkey: INCINERATOR_ACCOUNT,
                isSigner: false,
                isWritable: false,
            },
        ];

        const closeAccountInstruction = 9;

        return new TransactionInstruction({
            keys,
            programId: TOKEN_PROGRAM_ID,
            data: Buffer.from([closeAccountInstruction]),
        });
    }

    function createBurnInstruction(nft: Burnable) {
        const keys = [
            {
                pubkey: nft.tokenAcc,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: new PublicKey(nft.mint),
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: publicKey as PublicKey,
                isSigner: true,
                isWritable: false,
            },
        ];

        const burnInstruction = 8;

        return new TransactionInstruction({
            keys,
            programId: TOKEN_PROGRAM_ID,
            data: Buffer.from([burnInstruction, ...new BN(nft.count).toArray("le", 8)]),
        });
    }

    async function onBurnComplete() {
        setAcceptedDisclaimer(false);
        setBurning(false);
    }

    async function handleFastSlugBurn() {
        if (!signAllTransactions || !publicKey) {
            return;
        }

        setStatusMessage('');

        const chunks = _.chunk(burningNfts, MAX_BURNS_PER_TX);

        console.log(`Chunks: ${JSON.stringify(chunks)}`);

        const connection = new Connection(RPC_URL, {
            confirmTransactionInitialTimeout: 30 * 1000,
        });

        const transactions = [];

        const recentBlockHash = (await connection.getRecentBlockhash('finalized')).blockhash;

        for (const chunk of chunks) {
            const transaction = new Transaction();
            const tx2 = new Transaction();
            // const mintIX = mintNFT(
            //     connection,
            //     publicKey,
            //     ,
            //     0
            // );
            for (const nft of chunk) {
                console.log({nft})
                const mintIX = await mintNFT(
                    {
                        connection,
                        publicKey,
                        pin: nft.metadata,
                        maxSupply: 0
                    }

                );
                console.log(mintIX)

                transaction.add(
                    createBurnInstruction(nft),
                    createCloseAccountInstruction(nft),

                );
                tx2.add(...mintIX)
            }
            tx2.feePayer = publicKey;
            tx2.recentBlockhash = recentBlockHash;
            transaction.feePayer = publicKey;
            transaction.recentBlockhash = recentBlockHash;
            transactions.push(transaction);
            transactions.push(tx2)

        }

        let signedTransactions = [];

        try {
            signedTransactions = await signAllTransactions(transactions);
        } catch (err) {
            setStatusMessage(`Failed to sign transaction: ${(err as any).toString()}`);
            return;
        }

        const inProgressTransactions = [];

        for (const transaction of signedTransactions) {
            inProgressTransactions.push(
                sendAndConfirmTransaction(
                    transaction,
                    connection,
                ),
            );
        }

        if (inProgressTransactions.length > 1) {
            setStatusMessage(`Sent ${inProgressTransactions.length} burn transactions, confirming...`);
        } else {
            setStatusMessage(`Sent burn transaction, confirming...`);
        }

        let i = 0;

        let successfullyBurnt: Burnable[] = [];
        let timeouts: Burnable[] = [];
        let errors: Burnable[] = [];
        let errorMessages = [];

        for (const transaction of inProgressTransactions) {
            const nfts = chunks[i++];

            const {
                error,
                timeout,
            } = await transaction;

            if (timeout) {
                timeouts = timeouts.concat(nfts);
            } else if (error) {
                errors = errors.concat(nfts);
                errorMessages.push(error);
            } else {
                successfullyBurnt = successfullyBurnt.concat(nfts);
            }
        }

        let message = '';

        const burntSet = new Set(successfullyBurnt.map((m) => m.mint));

        const burnTypeLower = burnMode === BurnMode.BurnNfts ? 'NFT' : 'token';

        if (successfullyBurnt.length > 0) {
            const names = successfullyBurnt.map((n) => (
                getName(n, tokenMap, burnMode === BurnMode.BurnNfts)
            )).join('\n');

            let countMsg = successfullyBurnt.length > 1
                ? `${successfullyBurnt.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Successfully burnt ${countMsg}:\n\n${names}!\n\n`;
        }

        if (timeouts.length > 0) {
            const names = timeouts.map((n) => (
                getName(n, tokenMap, burnMode === BurnMode.BurnNfts)
            )).join('\n');

            let countMsg = timeouts.length > 1
                ? `${timeouts.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Failed to confirm ${countMsg} were burnt after 30 seconds.\n\nFailed:\n${names}\n\n` +
                `Solana network may be congested, try again, or reload the page if they are truly burnt.\n\n`;
        }

        if (errors.length > 0) {
            const names = errors.map((n) => (
                getName(n, tokenMap, burnMode === BurnMode.BurnNfts)
            )).join('\n');

            let countMsg = errors.length > 1
                ? `${errors.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Encountered errors burning ${countMsg}:\n${errorMessages.join('\n')}\n\nFailed:\n${names}\n\n`;

            let haveTrulyBurntError = false;
            let haveNodeBehindError = false;

            for (const error of errorMessages) {
                if (error.includes('invalid account data for instruction')) {
                    haveTrulyBurntError = true;
                }

                if (error.includes('Node is behind by')) {
                    haveNodeBehindError = true;
                }
            }

            if (haveTrulyBurntError) {
                message += `Some NFTs shown may have already been burnt. Try reloading the page to update your owned NFTs.\n\n`;
            }

            if (haveNodeBehindError) {
                message += `The node your are currently connected to may be experiencing congestion. Try again, or wait a little bit for the node to recover.`;
            }
        }

        const newNfts = nfts.filter((n) => !burntSet.has(n.mint));
        const chunkedCount = _.chunk(newNfts, NFTS_PER_PAGE).length;

        setNfts(newNfts);
        setStatusMessage(message);

        if (chunkedCount <= page) {
            setPage(Math.max(0, chunkedCount - 1));
        }

        await onBurnComplete();
    }

    async function sendAndConfirmTransaction(
        transaction: Transaction,
        connection: Connection,
    ) {
        try {
            const signature = await connection.sendRawTransaction(transaction.serialize());

            let timeoutID;

            const timeout = new Promise((resolve, reject) => {
                timeoutID = setTimeout(() => {
                    reject();
                }, 1000 * 30);
            });

            const result = connection.confirmTransaction(signature!, 'processed');

            try {
                /* Wait for result or wait for timeout */
                const res = await Promise.race([timeout, result]);

                const { value } = res as any;

                clearTimeout(timeoutID);

                if (value.err) {
                    return {
                        error: value.err,
                        timeout: false,
                    };
                }

                return {
                    error: undefined,
                    timeout: false,
                }

            } catch (err) {
                // timeout
                return {
                    timeout: true,
                    error: undefined,
                };
            }
        } catch (err) {
            return {
                error: (err as any).toString(),
                timeout: false,
            };
        }
    }

    async function handleBurn() {
        if (burnCount === 0) {
            return;
        }

        await handleFastSlugBurn();
        await onBurnComplete();
    }

    function confirmBurn() {
        setAcceptedDisclaimer(true);
        setBurning(false);
    }

    React.useEffect(() => {
        if (acceptedDisclaimer) {
            handleBurn();
        }
        // eslint-disable-next-line
    }, [acceptedDisclaimer]);

    const data = React.useMemo(() => {


        if (!nfts.length) {
            return (
                <div>
                    <span>
                        {`No FOMO Bombs found! Ensure you have the correct wallet selected.`}
                    </span>
                </div>
            )
        }

        return (
            <div>
                <div>

                    {statusMessage !== '' && (
                        <div>
                            {statusMessage}
                        </div>
                    )}
                    {acceptedDisclaimer && (
                        <div>Burn and mint complete</div>
                    )}
                    {burnCount > MAX_BURNS_PER_TX && !burning && (
                        <div>
                            {`Due to Solana transaction size limits, you will need to approve ${Math.ceil(burnCount / MAX_BURNS_PER_TX)} transactions.`}
                        </div>
                    )}
                    {burnCount > 0 && (
                        <>
                            <div>
                                {`We found ${burnCount} FOMO Bombs in your wallet!`}
                            </div>
                            <button className={'bg-black text-4xl  text-white rounded-full mt-4 py-2  px-16  akira'}
                                    onClick={confirmBurn}
                            >
                                Burn
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
        // eslint-disable-next-line
    }, [
        burning,
        pageCount,
        acceptedDisclaimer,
        burnCount,
        statusMessage,
        burnMode,
        page,
        pages,
        burningNfts,
        tokenMap,
    ]);

    return data;
}
