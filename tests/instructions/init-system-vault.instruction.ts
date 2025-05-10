import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "./program";

interface InitSystemVaultPayload {
  operator: PublicKey;
  systemAuthority: PublicKey;
  mint: PublicKey;
  systemVault: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export const initSystemVaultIx = async (
  connection: anchor.web3.Connection,
  payload: InitSystemVaultPayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .initSystemVault()
    .accountsPartial({
      operator: payload.operator,
      systemAuthority: payload.systemAuthority,
      mint: payload.mint,
      systemVault: payload.systemVault,
      tokenProgram: payload.tokenProgram,
      associatedTokenProgram: payload.associatedTokenProgram,
      systemProgram: payload.systemProgram,
    })
    .instruction();
};
