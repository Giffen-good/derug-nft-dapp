import * as fs from 'fs';
import {Keypair, PublicKey} from "@solana/web3.js";
import { NodeWallet } from '@metaplex/js'
import {PROGRAM_ID as MPL_TOKEN_METADATA_PROGRAM_ID} from '@metaplex-foundation/mpl-token-metadata';



interface UpdateAuthorityWallet {
    updateAuthorityWallet: NodeWallet;
    updateAuthorityKeypair: Keypair;
}
export const getUpdateAuthorityWallet = (path = '/Users/chrisrock/.config/solana/fomo-dev-update.json'): UpdateAuthorityWallet  => {
    const secretKey = fs.readFileSync(
        path,
        "utf8"
    );
    const keypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(secretKey))
    );

    return {updateAuthorityWallet: new NodeWallet(keypair), updateAuthorityKeypair: keypair}

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