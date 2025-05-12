import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "./program";

interface WithdrawFeePayload {
  amount: anchor.BN;

  operator: PublicKey;
  mint: PublicKey;
  systemAuthority: PublicKey;
  systemVault: PublicKey;
  destination: PublicKey;
  destinationAta: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export const withdrawFeeIx = async (
  connection: anchor.web3.Connection,
  payload: WithdrawFeePayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .withdrawFee(payload.amount)
    .accountsPartial({
      operator: payload.operator,
      mint: payload.mint,
      systemAuthority: payload.systemAuthority,
      systemVault: payload.systemVault,
      destination: payload.destination,
      destinationAta: payload.destinationAta,
      tokenProgram: payload.tokenProgram,
      associatedTokenProgram: payload.associatedTokenProgram,
      systemProgram: payload.systemProgram,
    })
    .instruction();
};
