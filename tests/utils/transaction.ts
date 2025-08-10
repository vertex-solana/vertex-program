import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";

interface SendSolanaTransaction {
  connection: Connection;
  tx: Transaction;
  payer: Keypair;
}

export const sendSolanaTransaction = async (payload: SendSolanaTransaction) => {
  const { connection, payer, tx } = payload;

  const blockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash.blockhash;
  tx.feePayer = payer.publicKey;

  const txHash = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "finalized",
  });

  return txHash;
};
