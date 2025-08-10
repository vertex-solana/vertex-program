import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getProgram } from "../utils/program";

interface ChargeFeeAccounts {
  operator: PublicKey;
  user: PublicKey;
  userVault: PublicKey;
  systemAuthority: PublicKey;

  indexers: PublicKey[];
}

interface ChargeFeeParams {}

interface ChargeFeePayload {
  accounts: ChargeFeeAccounts;
  params: ChargeFeeParams;
}

export const chargeFeeIx = async (
  connection: Connection,
  payload: ChargeFeePayload
): Promise<TransactionInstruction> => {
  const { accounts } = payload;
  const program = getProgram(connection);

  return await program.methods
    .chargeFee()
    .accountsPartial({
      operator: accounts.operator,
      user: accounts.user,
      userVault: accounts.userVault,
      systemAuthority: accounts.systemAuthority,
    })
    .remainingAccounts(
      accounts.indexers.map((indexer) => ({
        pubkey: indexer,
        isSigner: false,
        isWritable: true,
      }))
    )
    .instruction();
};
