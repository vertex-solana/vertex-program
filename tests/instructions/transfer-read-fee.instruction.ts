import * as anchor from "@coral-xyz/anchor";
import { getProgram } from "./program";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

interface TransferReadFeePayload {
  amount: anchor.BN;
  indexerId: anchor.BN;

  operator: PublicKey;
  mint: PublicKey;
  indexerOwner: PublicKey;
  indexer: PublicKey;
  indexerVault: PublicKey;
  payerVault: PublicKey;
  payerVaultAta: PublicKey;
  tokenProgram: PublicKey;
}

export const transferReadFeeIx = async (
  connection: anchor.web3.Connection,
  payload: TransferReadFeePayload
): Promise<TransactionInstruction> => {
  const program = getProgram(connection);

  return await program.methods
    .transferReadFee(payload.indexerId, payload.amount)
    .accountsPartial({
      operator: payload.operator,
      mint: payload.mint,
      indexerOwner: payload.indexerOwner,
      indexer: payload.indexer,
      indexerVault: payload.indexerVault,
      payerVault: payload.payerVault,
      payerVaultAta: payload.payerVaultAta,
      tokenProgram: payload.tokenProgram,
    })
    .instruction();
};
