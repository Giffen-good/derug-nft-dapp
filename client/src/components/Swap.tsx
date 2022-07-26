import React from 'react';

import {
    Connection,
    Transaction,
    PublicKey

} from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import {API_URL, RPC_URL} from '../lib/Constants';
import { Metadata, Mint, BurnMode, Burnable } from '../lib/Types';
import { MAX_BURNS_PER_TX } from '../lib/Constants';

export interface WalletContentProps {
    nfts: Burnable[];
    setNfts: React.Dispatch<React.SetStateAction<Metadata[] | Mint[]>>;
    burnMode: BurnMode;
}


export function Swap(props: WalletContentProps) {
    const {
        nfts,
        burnMode,
    } = props;
    const [burning, setBurning] = React.useState<boolean>(false);
    const [acceptedDisclaimer, setAcceptedDisclaimer] = React.useState<boolean>(false);
    const {
        publicKey,
        signAllTransactions
    } = useWallet();


    const burningNfts = React.useMemo(() => {
        return nfts.filter((n) => n.markForBurn);
    }, [nfts]);

    const burnCount = React.useMemo(() => burningNfts.length, [burningNfts]);
    const [statusMessage, setStatusMessage] = React.useState<string>(burnCount ? `We found ${burnCount} Brave ${burnCount > 1 ? 'Cats' : 'Cat'} in your wallet!` : '');
    const [burnComplete, setBurnComplete] = React.useState<boolean>(false)
    React.useEffect(() => {
        onBurnComplete();
    }, [burnMode]);


    async function onBurnComplete() {
        setAcceptedDisclaimer(false);
        setBurnComplete(true)
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
                'Referer': 'https://bravecats.com'
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
            setBurning(true)
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
           
            message += `Successfully Swapped ${successfullyBurnt.length} Brave ${successfullyBurnt.length > 1 ? 'Cats' : 'Cat'}`;
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

    const refreshPage = () => {
        window.location.reload()
    }
    const BurnButton = () => {
        if (burnComplete && burnCount > MAX_BURNS_PER_TX) {
            return (
                <button className={'bg-black text-4xl  text-white rounded-full mt-4 py-2  px-16'}
                        onClick={refreshPage}
                >
                    SWAP MORE
                </button>
            )
        } else if (burnComplete) {
            return <div></div>
        } else {
            return (
                <button className={'bg-black text-4xl  text-white rounded-full mt-4 py-2  px-16'}
                        onClick={confirmBurn}
                >
                    SWAP
                </button>
            )
        }
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
                        {`No Brave Cats found! Ensure you have the correct wallet selected.`}
                    </span>
                </div>
            )
        }

        return (
            <div className={'akira'}>
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
                            {!burning && (
                                <BurnButton />
                            )}
                        </>
                    )}
                </div>
            </div>
        );
        // eslint-disable-next-line
    }, [
        burning,
        acceptedDisclaimer,
        burnCount,
        statusMessage,
        burnMode,
        burningNfts,
    ]);

    return data;
}
