import { clusterApiUrl, Connection } from "@solana/web3.js";
import { MAGIC_BLOCK_ER_DEVNET_ENDPOINT } from "../constant";
import { EventParser } from "@coral-xyz/anchor";
import { getProgram } from "../get-program";

const execute = async (payload: { txHash: string; isTxInER: boolean }) => {
  const { isTxInER, txHash } = payload;

  let connection: Connection;

  if (isTxInER) {
    connection = new Connection(MAGIC_BLOCK_ER_DEVNET_ENDPOINT);
  } else {
    connection = new Connection(clusterApiUrl("devnet"));
  }

  const program = getProgram(connection);

  const tx = await connection.getParsedTransaction(txHash);
  const eventParser = new EventParser(program.programId, program.coder);
  const events = eventParser.parseLogs(tx.meta.logMessages);
  for (let event of events) {
    console.log(event);
  }
};

execute({
  txHash: "2buJsZfaJ6HmEPL1HYYcdWddYf3AEygcWt58nKPq8LKwm7DEMUJPu87VTduMGubyybp6LRnC11Vvpzo9mVZET3Sp",
  isTxInER: true,
});
