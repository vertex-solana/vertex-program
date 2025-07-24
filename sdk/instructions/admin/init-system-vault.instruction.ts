import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../../utils/program";

interface InitSystemVaultAccounts {
  operator: PublicKey;
  systemAuthority: PublicKey;
  systemProgram: PublicKey;
}

interface InitSystemVaultParams {}

interface InitSystemVaultPayload {
  params: InitSystemVaultParams;
  accounts: InitSystemVaultAccounts;
}

export const initSystemVaultIx = async (
  connection: Connection,
  payload: InitSystemVaultPayload
): Promise<TransactionInstruction> => {
  const accounts = payload.accounts;

  const program = getProgram(connection);

  return await program.methods
    .initSystemVault()
    .accountsPartial({
      operator: accounts.operator,
      systemAuthority: accounts.systemAuthority,
      systemProgram: accounts.systemProgram,
    })
    .instruction();
};
