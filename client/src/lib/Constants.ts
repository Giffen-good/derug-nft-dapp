import {PublicKey, clusterApiUrl} from "@solana/web3.js";

export const RPC_URL: string = process.env.REACT_APP_RPC_URL || clusterApiUrl('devnet');

export const API_URL: string = process.env.REACT_APP_API_URL || 'http://localhost:8080'
export const METADATA_ADDRESS_BATCH_SIZE: number = 100;
export const METADATA_ACCOUNT_BATCH_SIZE: number = 5;

export const MAX_BURNS_PER_TX: number = 10;

export const METADATA_PROGRAM: PublicKey = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const WRAPPED_SOL: string = 'So11111111111111111111111111111111111111112';
