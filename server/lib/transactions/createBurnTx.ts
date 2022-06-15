import {
    createBurnInstruction,
    createCloseAccountInstruction
} from "@solana/spl-token";
import {Burnable} from "../Types";
import {PublicKey, TransactionInstruction} from "@solana/web3.js";

export const createBurnTx = (nft: Burnable, userPublicKey: PublicKey): TransactionInstruction[] => {
    return [
        createBurnInstruction(
            new PublicKey(nft.tokenAcc),
            new PublicKey(nft.mint),
            userPublicKey,
            1,

        ),
        createCloseAccountInstruction(
            new PublicKey(nft.tokenAcc),
            userPublicKey,
            userPublicKey
        )
    ]

}