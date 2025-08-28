import { MODES, rpc } from "../constant";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getProgram } from "../get-program";
import { seeds } from "../../sdk";

import * as dotenv from "dotenv";
dotenv.config();

const mode = process.env.MODE;

if (!MODES.includes(mode)) {
  throw new Error("Invalid mode");
}

console.log("Running at mode: ", mode);

const connection = new Connection(rpc[mode].baseChain);
const connectionER = new Connection(rpc[mode].magicblockProvider);
console.log("connection base chain", connection.rpcEndpoint);
console.log("connection magicblock provider", connectionER.rpcEndpoint);

const program = getProgram(connection);
const programER = getProgram(connectionER);

const userKeypair = Keypair.fromSecretKey(bs58.decode(""));

console.log("User public key", userKeypair.publicKey.toBase58());

const execute = async () => {
  const userVault = PublicKey.findProgramAddressSync(
    seeds.userVault(userKeypair.publicKey),
    program.programId
  )[0];
  console.log("🚀 ~ execute ~ userVault:", userVault.toBase58());

  const userVaultDataAtEr = await programER.account.userVault.fetch(userVault);
  const userVaultData = await program.account.userVault.fetch(userVault);
  console.log("User vault data", userVaultData);
  console.log("User vault data at ER", userVaultDataAtEr);
};

execute();
