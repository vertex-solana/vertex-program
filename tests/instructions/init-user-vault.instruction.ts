import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "./program";

interface InitUserVaultPayload {
  owner: PublicKey;
  userVault: PublicKey;
  systemProgram: PublicKey;
}

export const initUserVaultIx = async (
  connection: anchor.web3.Connection,
  payload: InitUserVaultPayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .initUserVault()
    .accountsPartial({
      owner: payload.owner,
      userVault: payload.userVault,
      systemProgram: payload.systemProgram,
    })
    .instruction();
};
