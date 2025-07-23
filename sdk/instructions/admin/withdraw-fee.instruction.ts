import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../../utils/program";

interface WithdrawFeeAccounts {
  operator: PublicKey;
  systemAuthority: PublicKey;
  destination: PublicKey;
}

interface WithdrawFeeParams {
  amount: anchor.BN;
}

interface WithdrawFeePayload {
  accounts: WithdrawFeeAccounts;
  params: WithdrawFeeParams;
}

export const withdrawFeeIx = async (
  connection: anchor.web3.Connection,
  payload: WithdrawFeePayload
): Promise<TransactionInstruction> => {
  const { accounts, params } = payload;
  const program = getProgram(connection);

  return await program.methods
    .withdrawFee(params.amount)
    .accountsPartial({
      operator: accounts.operator,
      systemAuthority: accounts.systemAuthority,
      destination: accounts.destination,
    })
    .instruction();
};
