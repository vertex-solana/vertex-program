import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "./program";

interface DepositPayload {
  amount: anchor.BN;
  payer: PublicKey;
  userVault: PublicKey;
  mint: PublicKey;
  userAta: PublicKey;
  userVaultAta: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export const depositIx = async (
  connection: anchor.web3.Connection,
  payload: DepositPayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .deposit(payload.amount)
    .accountsPartial({
      payer: payload.payer,
      userVault: payload.userVault,
      mint: payload.mint,
      userAta: payload.userAta,
      userVaultAta: payload.userVaultAta,
      tokenProgram: payload.tokenProgram,
      associatedTokenProgram: payload.associatedTokenProgram,
      systemProgram: payload.systemProgram,
    })
    .instruction();
};
