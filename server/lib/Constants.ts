import {PublicKey, clusterApiUrl} from "@solana/web3.js";
export const RPC_URL: string = process.env.RPC_URL || clusterApiUrl('devnet');
export const HASHMAP_FILE: string = process.env.HASHTABLE_FILE || 'nft-hashmap_devnet_sample-collection_8ih2rmb3zRKr7sjeo1BF3tUcybj8sw1zSpQjfZtNqRuZ.json'
export const METADATA_ADDRESS_BATCH_SIZE: number = 100;
export const METADATA_ACCOUNT_BATCH_SIZE: number = 5;
export const METADATA_URL_BATCH_SIZE: number = 20;

export const METADATA_PROGRAM_ID =
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export const INCINERATOR_ACCOUNT = new PublicKey('burn68h9dS2tvZwtCFMt79SyaEgvqtcZZWJphizQxgt');

export const MAX_BURNS_PER_TX: number = 10;
export const CLIENT_URL: string = process.env.CLIENT_URL || 'http://localhost:3000';
export const WRAPPED_SOL: string = 'So11111111111111111111111111111111111111112';
