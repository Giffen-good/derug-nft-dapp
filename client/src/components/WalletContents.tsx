import React from 'react';
import * as _ from 'lodash';

import {
    Connection,
    Transaction,
    PublicKey

} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import {API_URL, RPC_URL} from '../lib/Constants';
import { Metadata, Mint, BurnMode, Burnable } from '../lib/Types';
import { NFTS_PER_PAGE, MAX_BURNS_PER_TX } from '../lib/Constants';

export interface WalletContentProps {
    nfts: Burnable[];
    setNfts: React.Dispatch<React.SetStateAction<Metadata[] | Mint[]>>;
    burnMode: BurnMode;
}


export function WalletContents(props: WalletContentProps) {
    const {
        nfts,
        burnMode,
    } = props;
    const [page, setPage] = React.useState<number>(0);
    const [burning, setBurning] = React.useState<boolean>(false);
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
    const [statusMessage, setStatusMessage] = React.useState<string>(burnCount ? `We found ${burnCount} FOMO Bombs in your wallet!` : '');

    const pageCount = React.useMemo(() => pages.length, [pages]);

    React.useEffect(() => {
        setPage(0);
    }, [pageCount]);

    React.useEffect(() => {
        onBurnComplete();
    }, [burnMode]);


    async function onBurnComplete() {
        setAcceptedDisclaimer(false);
        setBurning(false);
    }
    async function getMintAndBurnTxs(nfts: Burnable[], publicKey: PublicKey) : Promise<string[]> {
        try {
            setStatusMessage('Building Transactions - Please Wait...')
            const { data } = await axios.post(API_URL + '/createMintAndBurnIX', {
                key: publicKey.toString(),
                nfts
            })
            // console.log(JSON.stringify(data, null, 4))
            return data.txs;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log('error message: ', error.message);
                // 👇️ error: AxiosError<any, any>
            } else {
                console.log('unexpected error: ', error);
            }
            throw error;
        }
    }
    function unpackTxs(serializedTxs: string[]) {
        const txs = []
        for (const sTx of serializedTxs) {
            const tx = Transaction.from(Buffer.from(sTx, 'base64'));
            txs.push(tx)
        }
        return txs;
    }
    async function MintAndBurn() {
        if (!signAllTransactions || !publicKey) {
            return;
        }

        setStatusMessage('');



        const connection = new Connection(RPC_URL, {
            confirmTransactionInitialTimeout: 30 * 1000,
            httpHeaders: {
                'Content-Type': 'application/json',
                'Referer': 'https://fomo-bombs.netlify.app'
            }
        });
        if (!publicKey) return

        let signedTransactions = [];
        try {
            const serializedTxs = await getMintAndBurnTxs(burningNfts, publicKey);
            const transactions = unpackTxs(serializedTxs);
            signedTransactions = await signAllTransactions(transactions);
            console.log(signedTransactions)
        } catch (err) {
            console.log(err)
            setStatusMessage(`${(err as any).toString()}\n`);
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
            const nft = burningNfts[i]
            console.log({transaction})
            const {
                error,
                timeout,
            } = await transaction;

            if (timeout) {
                timeouts = timeouts.concat(nft);
            } else if (error) {
                errors = errors.concat(nft);
                errorMessages.push(error);
            } else {
                successfullyBurnt = successfullyBurnt.concat(nft);
            }
        }

        let message = '';
        // const burntSet = new Set(successfullyBurnt.map((m) => m.mint));

        const burnTypeLower = burnMode === BurnMode.BurnNfts ? 'NFT' : 'token';

        if (successfullyBurnt.length > 0) {
            let countMsg = successfullyBurnt.length > 1
                ? `${successfullyBurnt.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Successfully Swapped ${countMsg} FOMO Bombs`;
        }

        if (timeouts.length > 0) {

            let countMsg = timeouts.length > 1
                ? `${timeouts.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Failed to confirm ${countMsg} were burnt after 30 seconds.\n\n` +
                `Solana network may be congested, try again, or reload the page if they are truly burnt.\n\n`;
        }

        if (errors.length > 0) {

            let countMsg = errors.length > 1
                ? `${errors.length} ${burnTypeLower}s`
                : burnTypeLower;

            message += `Encountered errors burning ${countMsg}:\n${errorMessages.join('\n')}`;

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

        setStatusMessage(message);
        await onBurnComplete();
    }

    async function sendAndConfirmTransaction(
        transaction:  Transaction,
        connection: Connection,
    ) {
        console.log('sendAndConfirmTransaction')

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

        await MintAndBurn();
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


                    {burnCount > 0 && (
                        <>

                            {burnCount > MAX_BURNS_PER_TX && !burning && (
                                <div style={{fontSize: '0.65rem'}} className={"text-red-500 text-sm "}>
                                    {`Due to Solana transaction size limits, you will need to approve ${Math.ceil(burnCount / MAX_BURNS_PER_TX)} swaps to complete this process.`}
                                </div>
                            )}
                            {acceptedDisclaimer && (
                                <div>Initializing Swap.. </div>
                            )}
                            {statusMessage !== '' && (
                                <div>
                                    {statusMessage}
                                </div>
                            )}

                            <button className={'bg-black text-4xl  text-white rounded-full mt-4 py-2  px-16  akira'}
                                    onClick={confirmBurn}
                            >
                                SWAP
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
    ]);

    return data;
}
