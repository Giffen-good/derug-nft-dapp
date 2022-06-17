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
} from "@metaplex-foundation/mpl-token-metadata";
import {getMetadataPDA, getMasterEditionPDA, getIpfsMetadataUrl, getIpfsMeta} from "../util";
import {Burnable} from "../Types";

interface MintIxRes {
    mintIx: TransactionInstruction[];
    mint: Keypair;
}
export const createMintTx = async (connection: Connection, userPublicKey: PublicKey, updateAuthorityKeypair: Keypair, nft: Burnable )
    : Promise<MintIxRes> => {
    let mint = Keypair.generate();
    console.log(`mint: ${mint.publicKey.toBase58()}`);
    let ata = await getAssociatedTokenAddress(mint.publicKey, userPublicKey);
    const ipfsURL = getIpfsMetadataUrl(nft.mint);

    const {
        name,
        symbol,
    } = getIpfsMeta(nft.mint)

    let tokenMetadataPubkey = await getMetadataPDA(mint.publicKey);
    let masterEditionPubkey = await getMasterEditionPDA(mint.publicKey);

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
                updateAuthority: updateAuthorityKeypair.publicKey,
            },
            {
                createMetadataAccountArgsV2: {
                    data: {
                        name,
                        symbol: symbol,
                        uri: ipfsURL,
                        sellerFeeBasisPoints: 100,
                        creators: [
                            {
                                address: updateAuthorityKeypair.publicKey,
                                verified: true,
                                share: 100,
                            },
                            {
                                address: userPublicKey,
                                verified: false,
                                share: 0,
                            },
                        ],
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
                updateAuthority: updateAuthorityKeypair.publicKey,
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
