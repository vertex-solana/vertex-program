import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "./program";

interface InitIndexerPayload {
  indexerId: anchor.BN;
  owner: PublicKey;
  indexer: PublicKey;
  mint: PublicKey;
  indexerVault: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export const initIndexerIx = async (
  connection: anchor.web3.Connection,
  payload: InitIndexerPayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .initIndexer(payload.indexerId)
    .accountsPartial({
      owner: payload.owner,
      indexer: payload.indexer,
      mint: payload.mint,
      indexerVault: payload.indexerVault,
      tokenProgram: payload.tokenProgram,
      associatedTokenProgram: payload.associatedTokenProgram,
      systemProgram: payload.systemProgram,
    })
    .instruction();
};
