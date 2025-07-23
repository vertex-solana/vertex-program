import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { getProgram } from "../../utils/program";

interface CommitAndStartBillingAccounts {
  operator: PublicKey;
  user: PublicKey;
  userVault: PublicKey;
}

interface CommitAndStartBillingParams {}

interface CommitAndStartBillingPayload {
  params: CommitAndStartBillingParams;
  accounts: CommitAndStartBillingAccounts;
}

export const commitAndStartBillingIx = async (
  connection: anchor.web3.Connection,
  payload: CommitAndStartBillingPayload
): Promise<TransactionInstruction> => {
  const { accounts } = payload;
  const program = getProgram(connection);

  return await program.methods
    .commitAndStartBilling()
    .accountsPartial({
      operator: accounts.operator,
      user: accounts.user,
      userVault: accounts.userVault,
      magicProgram: MAGIC_PROGRAM_ID,
      magicContext: MAGIC_CONTEXT_ID,
    })
    .instruction();
};
