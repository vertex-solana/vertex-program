import { PublicKey } from "@solana/web3.js";
import { toLittleEndianBuffer64 } from "./number";

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
