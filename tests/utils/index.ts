import { Connection, PublicKey } from "@solana/web3.js";
import { toLittleEndianBuffer64 } from "./number";

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
  userVault: (owner: PublicKey) => [
    Buffer.from("user_vault"),
    owner.toBuffer(),
  ],
  indexer: (owner: PublicKey, indexerId: number) => [
    Buffer.from("indexer"),
    owner.toBuffer(),
    toLittleEndianBuffer64(indexerId),
  ],
};
