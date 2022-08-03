import {createMintTx} from './util/mint'
import fs from 'fs'
import {Connection, transactions} from "@metaplex/js";
import {clusterApiUrl, PublicKey, Transaction} from "@solana/web3.js";
import {getKeypairFromSecret, getUpdateAuthorityWallet} from "../lib/utils";

const MULTIPLIER = 8;
interface Meta {
    name: string;
    symbol: string;
    pin: string;
}
export const createSampleMint = async (): Promise<any> => {
    const assets = fs.readFileSync(__basedir + '/sample-assets.json',
        {encoding:'utf8', flag:'r'});
    const meta = JSON.parse(assets);
    const connection: Connection = new Connection(clusterApiUrl('devnet'));
    let res: {[index: string]: Meta}= {}
    for (let j = 0; j < MULTIPLIER; j++) {
        for (let i = 0; i < meta.length;i++) {
            const ipfsMeta = meta[i];
            const {updateAuthorityKeypair} = getUpdateAuthorityWallet();
            const userPub = process.env.TEST_RECIPIENT_WALLET || '';
            const userPubkey = new PublicKey(userPub)
            const {mintIx, mint}  = await createMintTx( connection, updateAuthorityKeypair.publicKey, userPubkey, ipfsMeta );
            const tx = new Transaction({feePayer: updateAuthorityKeypair.publicKey}).add(
                ...mintIx

            )
            const signers = [updateAuthorityKeypair, mint];

            tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            const fin = await connection.sendTransaction(tx, signers);
            const mintAddress: string = mint.publicKey.toBase58()
            res[mintAddress] = {
                pin: ipfsMeta.pin,
                name: ipfsMeta.name,
                symbol: ipfsMeta.symbol
            }
        }
    }
    return res;
}