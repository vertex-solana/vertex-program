import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "./program";

interface ChargeFeePayload {
  amount: anchor.BN;

  operator: PublicKey;
  user: PublicKey;
  mint: PublicKey;
  userVault: PublicKey;
  userVaultAta: PublicKey;
  systemAuthority: PublicKey;
  systemVault: PublicKey;
  tokenProgram: PublicKey;
}

export const chargeFeeIx = async (
  connection: anchor.web3.Connection,
  payload: ChargeFeePayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .chargeFee(payload.amount)
    .accountsPartial({
      operator: payload.operator,
      user: payload.user,
      mint: payload.mint,
      userVault: payload.userVault,
      userVaultAta: payload.userVaultAta,
      systemAuthority: payload.systemAuthority,
      systemVault: payload.systemVault,
      tokenProgram: payload.tokenProgram,
    })
    .instruction();
};
