import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { getProgram } from "../utils/program";

interface InitIndexerAccounts {
  owner: PublicKey;
  indexer: PublicKey;
}

interface InitIndexerParams {
  indexerId: anchor.BN;
  pricePerGbLamports: anchor.BN;
}

interface InitIndexerPayload {
  accounts: InitIndexerAccounts;
  params: InitIndexerParams;
}

export const initIndexerIx = async (
  connection: anchor.web3.Connection,
  payload: InitIndexerPayload
): Promise<TransactionInstruction> => {
  const { accounts, params } = payload;
  const program = getProgram(connection);

  return await program.methods
    .initIndexer(params.indexerId, params.pricePerGbLamports)
    .accountsPartial({
      owner: accounts.owner,
      indexer: accounts.indexer,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
};
