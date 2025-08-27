import { MODES, rpc } from "../constant";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getProgram } from "../get-program";
import { initIndexerIx, seeds } from "../../sdk";

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
const indexerId = 0; // NOTE: Change to your indexer id

console.log("User public key", userKeypair.publicKey.toBase58());

const execute = async () => {
  const indexer = PublicKey.findProgramAddressSync(
    seeds.indexer(userKeypair.publicKey, indexerId),
    program.programId
  )[0];

  const tx = new Transaction();
  const ix = await initIndexerIx(connection, {
    accounts: {
      owner: userKeypair.publicKey,
      indexer,
    },
    params: {
      indexerId: new BN(indexerId),
      pricePerGbLamports: new BN(0),
    },
  });
  tx.add(ix);

  const txHash = await sendSolanaTransaction({
    connection,
    payer: userKeypair,
    tx,
  });
  console.log("Init Indexer txHash: ", txHash);
};

execute();
