import { MODES, rpc } from "../constant";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getProgram } from "../get-program";
import { depositIx, seeds } from "../../sdk";

import * as dotenv from "dotenv";
import { sendSolanaTransaction } from "../../tests/utils";
import { BN } from "bn.js";
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

const userKeypair = Keypair.fromSecretKey(bs58.decode(""));
console.log("User public key", userKeypair.publicKey.toBase58());

const execute = async () => {
  const amount = 0.5;
  console.log(`Depositing ${amount} SOL...`);

  const userVault = PublicKey.findProgramAddressSync(
    seeds.userVault(userKeypair.publicKey),
    program.programId
  )[0];

  const tx = new Transaction();
  const ix = await depositIx(connection, {
    accounts: {
      payer: userKeypair.publicKey,
      userVault: userVault,
    },
    params: {
      amount: new BN(amount * LAMPORTS_PER_SOL),
    },
  });
  tx.add(ix);

  const txHash = await sendSolanaTransaction({
    connection,
    payer: userKeypair,
    tx,
  });
  console.log("Deposit user vault txHash: ", txHash);
};

execute();
