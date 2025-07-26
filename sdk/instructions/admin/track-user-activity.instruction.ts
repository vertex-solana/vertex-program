import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../../utils/program";
import BN from "bn.js";

interface TrackUserActivityAccounts {
  operator: PublicKey;
  user: PublicKey;
  userVault: PublicKey;
  indexer: PublicKey | null;
}

interface TrackUserActivityParams {
  indexerId: BN | null;
  bytes: BN;
}

interface TrackUserActivityPayload {
  accounts: TrackUserActivityAccounts;
  params: TrackUserActivityParams;
}

export const trackUserActivityIx = async (
  connection: Connection,
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
