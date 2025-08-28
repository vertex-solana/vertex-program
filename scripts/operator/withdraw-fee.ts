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
import { seeds, withdrawFeeIx } from "../../sdk";

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

const operatorKeypair = Keypair.fromSecretKey(bs58.decode(""));
console.log("Operator public key", operatorKeypair.publicKey.toBase58());

const execute = async () => {
  const amount = 10;
  console.log(`Withdraw ${amount} SOL...`);

  const systemAuthority = PublicKey.findProgramAddressSync(
    seeds.systemAuthority(),
    program.programId
  )[0];

  const tx = new Transaction();
  const ix = await withdrawFeeIx(connection, {
    accounts: {
      destination: operatorKeypair.publicKey,
      operator: operatorKeypair.publicKey,
      systemAuthority: systemAuthority,
    },
    params: {
      amount: new BN(amount * LAMPORTS_PER_SOL),
    },
  });
  tx.add(ix);

  const txHash = await sendSolanaTransaction({
    connection,
    payer: operatorKeypair,
    tx,
  });
  console.log("Withdraw Authority Fee txHash: ", txHash);
};

execute();
