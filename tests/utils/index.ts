import { Connection, PublicKey } from "@solana/web3.js";

export const log = async (
  connection: Connection,
  signature: string
): Promise<string> => {
  console.log(
    `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
  );
  return signature;
};

export const seeds = {
  systemAuthority: () => [Buffer.from("system_authority")],
  userVault: (owner: PublicKey) => [Buffer.from("user_vault"), owner.toBuffer()],
};
