import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../../utils/program";

interface TrackUserActivityAccounts {
  operator: PublicKey;
  user: PublicKey;
  userVault: PublicKey;
  indexer: PublicKey | null;
}

interface TrackUserActivityParams {
  indexerId: anchor.BN | null;
  bytes: anchor.BN;
}

interface TrackUserActivityPayload {
  accounts: TrackUserActivityAccounts;
  params: TrackUserActivityParams;
}

export const trackUserActivityIx = async (
  connection: anchor.web3.Connection,
  payload: TrackUserActivityPayload
): Promise<TransactionInstruction> => {
  const { accounts, params } = payload;
  const program = getProgram(connection);

  return await program.methods
    .trackUserActivity(params)
    .accountsPartial({
      operator: accounts.operator,
      user: accounts.user,
      userVault: accounts.userVault,
      indexer: accounts.indexer,
    })
    .instruction();
};
