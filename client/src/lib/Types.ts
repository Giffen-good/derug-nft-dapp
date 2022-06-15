import {AccountInfo, ParsedAccountData, PublicKey} from '@solana/web3.js';

export interface Attribute {
    trait_type: string;
    value: string;
}

export interface Collection {
    name: string;
    family: string;
}

export interface Creator {
    address: string;
    share: number;
}

export interface File {
    uri: string;
    type: string;
}

export interface Properties {
    category: string;
    creators: Creator[];
    files: File[];
    seller_fee_basis_points: number;
    symbol: string;
}

export interface MetadataURL extends Mint {
    url?: string;
    name: string;
    symbol: string;
}

export interface Burnable {
    mint: string;
    tokenAcc: PublicKey;
    count: number;
    markForBurn: boolean;
    burnt: boolean;
    uiAmount: number;
}
export interface NftAccountData {
    account: AccountInfo<ParsedAccountData>;
    pubkey: PublicKey;
}
export interface Mint extends Burnable {
}

export interface Metadata extends Burnable {
    attributes: Attribute[];
    collection: Collection;
    description: string;
    external_url: string;
    image: string;
    name: string;
    properties: Properties;
}

export interface MetadataAddress extends Mint {
    metadataAddress: PublicKey;
}

export enum BurnMode {
    BurnNfts = 1,
    BurnKnownTokens = 2,
    BurnUnknownTokens = 3,
}
