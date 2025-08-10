import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "../utils/program";

interface WithdrawIndexerFeeAccounts {
  owner: PublicKey;
  indexer: PublicKey;
}

interface WithdrawIndexerFeeParams {
  indexerId: anchor.BN;
  amount: anchor.BN;
}

interface WithdrawIndexerFeePayload {
  accounts: WithdrawIndexerFeeAccounts;
  params: WithdrawIndexerFeeParams;
}

export const withdrawIndexerFeeIx = async (
  connection: anchor.web3.Connection,
  payload: WithdrawIndexerFeePayload
): Promise<TransactionInstruction> => {
  const { accounts, params } = payload;
  const program = getProgram(connection);

  return await program.methods
    .withdrawIndexerFee(params.indexerId, params.amount)
    .accountsPartial({
      owner: accounts.owner,
      indexer: accounts.indexer,
    })
    .instruction();
};
