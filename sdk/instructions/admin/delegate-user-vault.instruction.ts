import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  DELEGATION_PROGRAM_ID,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationMetadataPdaFromDelegatedAccount,
  delegationRecordPdaFromDelegatedAccount,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { getProgram } from "../../utils/program";

interface DelegateUserVaultAccounts {
  operator: PublicKey;
  user: PublicKey;
  userVault: PublicKey;
}

interface DelegateUserVaultParams {}

interface DelegateUserVaultPayload {
  params: DelegateUserVaultParams;
  accounts: DelegateUserVaultAccounts;
}

export const delegateUserVaultIx = async (
  connection: Connection,
  payload: DelegateUserVaultPayload
): Promise<TransactionInstruction> => {
  const { accounts } = payload;
  const program = getProgram(connection);

  return await program.methods
    .delegateUserVault()
    .accountsPartial({
      operator: accounts.operator,
      user: accounts.user,
      userVault: accounts.userVault,
      ownerProgram: program.programId,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      bufferUserVault: delegateBufferPdaFromDelegatedAccountAndOwnerProgram(
        accounts.userVault,
        program.programId
      ),
      delegationMetadataUserVault: delegationMetadataPdaFromDelegatedAccount(
        accounts.userVault
      ),
      delegationRecordUserVault: delegationRecordPdaFromDelegatedAccount(
        accounts.userVault
      ),
    })
    .instruction();
};
