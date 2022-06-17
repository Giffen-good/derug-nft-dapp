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
    const res = fs.readFileSync(`${global.__basedir}/map/${process.env.HASHTABLE_PATH}`,'utf8');
    return JSON.parse(res)
}

export const isMemberOfCollection = async (mintAddress: string) : Promise<Boolean> => {
    const hashlist = getHashlist();
    return hashlist.includes(mintAddress);

}

export const getIpfsMetadataUrl = (tokenAddress: string, privateGateway: Boolean = false): string => {
    const hashmap = getHashmap();
    const pin = hashmap[tokenAddress];
    return privateGateway ? `${process.env.PRIVATE_IPFS_GATEWAY_URL}${pin}` : `https://ipfs.infura.io/ipfs/${pin}`;
}
interface UpdateAuthorityWallet {
    updateAuthorityWallet: NodeWallet;
    updateAuthorityKeypair: Keypair;
}
export const getUpdateAuthorityWallet = (): UpdateAuthorityWallet  => {
    const walletSrc = process.env.UPDATE_AUTHORITY_PATH || '';
    const secretKey = fs.readFileSync(
        walletSrc,
        "utf8"
    );
    const keypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(secretKey))
    );

    return {updateAuthorityWallet: new NodeWallet(keypair), updateAuthorityKeypair: keypair}

}

interface Meta {
    name: string;
    symbol: string;
    pin: string;
}
interface IpfsTable {
    [key: string]: Meta
}
export const getIpfsMeta = (tokenAddress: string): Meta =>  {
    const res = fs.readFileSync(`${global.__basedir}/map/meta-${process.env.HASHTABLE_PATH}`,'utf8');
    const json: IpfsTable = JSON.parse(res)
    return json[tokenAddress];
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