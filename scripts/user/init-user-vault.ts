import { MODES, rpc } from "../constant";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getProgram } from "../get-program";
import { initUserVaultIx, seeds } from "../../sdk";

import * as dotenv from "dotenv";
import { sendSolanaTransaction } from "../../tests/utils";
dotenv.config();

const mode = process.env.MODE;

if (!MODES.includes(mode)) {
  throw new Error("Invalid mode");
}

console.log("Running at mode: ", mode);

const connection = new Connection(rpc[mode].baseChain);
const connectionER = new Connection(rpc[mode].magicblockProvider);
console.log('connection base chain', connection.rpcEndpoint);
console.log('connection magicblock provider', connectionER.rpcEndpoint);

const program = getProgram(connection);

const userKeypair = Keypair.fromSecretKey(bs58.decode(""));

console.log('User public key', userKeypair.publicKey.toBase58());

const execute = async () => {
  const userVault = PublicKey.findProgramAddressSync(
    seeds.userVault(userKeypair.publicKey),
    program.programId
  )[0];

  const tx = new Transaction();
  const ix = await initUserVaultIx(connection, {
    accounts: {
      owner: userKeypair.publicKey,
      userVault: userVault,
      systemProgram: SystemProgram.programId,
    },
    params: {},
  });
  tx.add(ix);

  const txHash = await sendSolanaTransaction({
    connection,
    payer: userKeypair,
    tx,
  });
  console.log("Init user vault txHash: ", txHash);
};

execute();
