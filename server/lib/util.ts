import fs from 'fs';
import {Hashmap} from "./Types";
import {Keypair, PublicKey} from "@solana/web3.js";
import { NodeWallet } from '@metaplex/js'
import {PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID} from '@metaplex-foundation/mpl-token-metadata';


export const getHashlist =  (): string[] => {
    const hashmap = getHashmap();
    return Object.keys(hashmap)
}
export const getHashmap = (): Hashmap => {
    const res = fs.readFileSync(`${global.__basedir}/${process.env.HASHTABLE_PATH}`,'utf8');
    return JSON.parse(res)
}

export const isMemberOfCollection = async (mintAddress: string) : Promise<Boolean> => {
    const hashlist = getHashlist();
    return hashlist.includes(mintAddress);

}

export const getIpfsMetadataUrl = (tokenAddress: string): string => {
    const hashmap = getHashmap();
    const pin = hashmap[tokenAddress];
    return `https://ipfs.infura.io/ipfs/${pin}`;
}
interface UpdateAuthorityWallet {
    updateAuthorityWallet: NodeWallet;
    updateAuthorityKeypair: Keypair;
}
export const getUpdateAuthorityWallet = (): UpdateAuthorityWallet  => {
    const walletSrc = `${global.__basedir}/${process.env.UPDATE_AUTHORITY_PATH}` || '';
    const secretKey = fs.readFileSync(
        walletSrc,
        "utf8"
    );
    const keypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(secretKey))
    );

    return {updateAuthorityWallet: new NodeWallet(keypair), updateAuthorityKeypair: keypair}

}


export const lengthInUtf8Bytes = (str: string) => {
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}

export async function getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
    const [publicKey] = await PublicKey.findProgramAddress(
        [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        MPL_TOKEN_METADATA_PROGRAM_ID
    );
    return publicKey;
}

export async function getMasterEditionPDA(mint: PublicKey): Promise<PublicKey> {
    const [publicKey] = await PublicKey.findProgramAddress(
        [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
        MPL_TOKEN_METADATA_PROGRAM_ID
    );
    return publicKey;
}