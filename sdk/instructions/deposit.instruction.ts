import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "../utils/program";

interface DepositAccounts {
  payer: PublicKey;
  userVault: PublicKey;
}

interface DepositParams {
  amount: anchor.BN;
}

interface DepositPayload {
  accounts: DepositAccounts;
  params: DepositParams;
}

export const depositIx = async (
  connection: anchor.web3.Connection,
  payload: DepositPayload
): Promise<TransactionInstruction> => {
  const { accounts, params } = payload;
  const program = getProgram(connection);

  return await program.methods
    .deposit(params.amount)
    .accountsPartial({
      payer: accounts.payer,
      userVault: accounts.userVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
};
