import {Connection, PublicKey, Transaction} from "@solana/web3.js";
import {Burnable} from "../Types";
import {createMintTx} from "./createMintTx";
import { getUpdateAuthorityWallet} from "../utils";
import {createBurnTx} from "./createBurnTx";
import {MAX_BURNS_PER_TX} from "../Constants";

export interface BuildTransactionParams {
    connection: Connection;
    userPublicKey: PublicKey;
    nfts: Burnable[];
}

export const buildTransactions = async (
{
    connection,
    userPublicKey,
    nfts
}: BuildTransactionParams): Promise<string[]> => {

    const { updateAuthorityKeypair } = getUpdateAuthorityWallet()
    let transactions = []
    for (const nft of nfts) {
        const {mintIx, mint} = await createMintTx(connection, userPublicKey, updateAuthorityKeypair, nft)
        const burnIx = createBurnTx(nft, userPublicKey);
        const tx = new Transaction({ feePayer: userPublicKey }).add(
            ...burnIx,
            ...mintIx

        )
        const signers = [updateAuthorityKeypair, mint];
        const latestBlockhash = await connection.getLatestBlockhash()
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
        tx.partialSign(...signers)
        transactions.push(tx.serialize({requireAllSignatures: false}).toString('base64'))
        if (MAX_BURNS_PER_TX < transactions.length - 1) break;
    }

    return transactions;
}