import fs from 'fs';
import {Keypair, PublicKey} from "@solana/web3.js";
import { NodeWallet } from '@metaplex/js'
import {PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID} from '@metaplex-foundation/mpl-token-metadata';
import bs58 from 'bs58'
import {HASHMAP_FILE} from './Constants'

export const getHashlist =  (): string[] => {
    const hashmap = getHashmap();
    return Object.keys(hashmap)
}
export const getHashmap = (): IpfsTable => {
    const res = fs.readFileSync(`${global.__basedir}/map/${HASHMAP_FILE}`,'utf8');
    return JSON.parse(res)
}


export const getIpfsMetadataUrl = (tokenAddress: string, privateGateway: Boolean = false): string => {
    const hashmap = getHashmap();
    const pin = hashmap[tokenAddress].pin;
    return privateGateway ? `${process.env.PRIVATE_IPFS_GATEWAY_URL}${pin}` : `https://ipfs.infura.io/ipfs/${pin}`;
}
interface UpdateAuthorityWallet {
    updateAuthorityWallet: NodeWallet;
    updateAuthorityKeypair: Keypair;
}
export const getUpdateAuthorityWallet = (): UpdateAuthorityWallet  => {
    const secretKey = process.env.UA_SECRET || '';
    const bytes = bs58.decode(secretKey);
    const keypair = Keypair.fromSecretKey(bytes);
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
    console.log(`${global.__basedir}/map/${HASHMAP_FILE}`)
    const res = fs.readFileSync(`${global.__basedir}/map/${HASHMAP_FILE}`,'utf8');
    console.log(res)
    console.log(tokenAddress)
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