import {PublicKey} from "@solana/web3.js";

export interface Burnable {
    mint: string;
    tokenAcc: PublicKey;
    count: number;
    markForBurn: boolean;
    burnt: boolean;
    uiAmount: number;
}

export interface Hashmap {
    [key: string]: string
}
export interface createMasterEditionV3InstructionParams {
    updateAuthorityPublicKey: PublicKey;
    mint: PublicKey;
    payer: PublicKey;
    metadataPDA: PublicKey;
    editionPDA: PublicKey;
}