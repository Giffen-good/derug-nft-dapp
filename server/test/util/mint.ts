import {Keypair, Connection, PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToCheckedInstruction,
    getAssociatedTokenAddress,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    createCreateMetadataAccountV2Instruction,
    createCreateMasterEditionV3Instruction,
    createSetAndVerifyCollectionInstruction
} from "@metaplex-foundation/mpl-token-metadata";
import {getMetadataPDA, getMasterEditionPDA} from "../../lib/utils";
interface MintIxRes {
    mintIx: TransactionInstruction[];
    mint: Keypair;
}
interface ipfsPin {
    ipfsURL: string;
    name: string;
    symbol: string;
}
export const createMintTx = async (connection: Connection, userPublicKey: PublicKey, ipfsPin: ipfsPin )
    : Promise<MintIxRes> => {
    let mint = Keypair.generate();
    console.log(`mint: ${mint.publicKey.toBase58()}`);
    let ata = await getAssociatedTokenAddress(mint.publicKey, userPublicKey);
    const { ipfsURL, name, symbol } = ipfsPin

    let tokenMetadataPubkey = await getMetadataPDA(mint.publicKey);
    let masterEditionPubkey = await getMasterEditionPDA(mint.publicKey);

    const creators = [
        {
            address: userPublicKey,
            verified: true,
            share: 100,
        }
    ]

    let mintIx = [
        SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: mint.publicKey,
            lamports: await getMinimumBalanceForRentExemptMint(connection),
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint.publicKey, 0, userPublicKey, userPublicKey),
        createAssociatedTokenAccountInstruction(userPublicKey, ata, userPublicKey, mint.publicKey),
        createMintToCheckedInstruction(mint.publicKey, ata, userPublicKey, 1, 0),
        createCreateMetadataAccountV2Instruction(
            {
                metadata: tokenMetadataPubkey,
                mint: mint.publicKey,
                mintAuthority: userPublicKey,
                payer: userPublicKey,
                updateAuthority: userPublicKey,
            },
            {
                createMetadataAccountArgsV2: {
                    data: {
                        name,
                        symbol: symbol,
                        uri: ipfsURL,
                        sellerFeeBasisPoints: 800,
                        creators,
                        collection: null,
                        uses: null,
                    },
                    isMutable: true,
                },
            }
        ),
        createCreateMasterEditionV3Instruction(
            {
                edition: masterEditionPubkey,
                mint: mint.publicKey,
                updateAuthority: userPublicKey,
                mintAuthority: userPublicKey,
                payer: userPublicKey,
                metadata: tokenMetadataPubkey,
            },
            {
                createMasterEditionArgs: {
                    maxSupply: 0,
                },
            }
        )
    ]
    return {
        mintIx,
        mint
    }
}
