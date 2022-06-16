import {createMintTx} from "./createMintTx";
import {Connection, Transaction} from "@solana/web3.js";
import {getUpdateAuthorityWallet} from './util'
(async () => {
  const connection = new  Connection('https://late-snowy-cherry.solana-devnet.quiknode.pro/223eb8cd5ee2c52058b1366d401dca25e6fd5ce1/')
  const {updateAuthorityKeypair, updateAuthorityWallet} = getUpdateAuthorityWallet();
  const userWallet = getUpdateAuthorityWallet('/Users/chrisrock/.config/solana/fomo-receiver.json')
  const {mintIx, mint} = await createMintTx(connection, userWallet.updateAuthorityKeypair.publicKey, updateAuthorityKeypair);
  const tx = new Transaction({ feePayer: userWallet.updateAuthorityKeypair.publicKey }).add(
    ...mintIx
  )
  const signers = [ mint, updateAuthorityKeypair ];

  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.partialSign(...signers)
  const serialized = tx.serialize({
    requireAllSignatures: false
  }).toString('base64')
  const ds = Transaction.from(Buffer.from(serialized, 'base64'));
  userWallet.updateAuthorityWallet.signAllTransactions([ds])
  await connection.sendRawTransaction(ds.serialize())
})()