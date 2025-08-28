import { clusterApiUrl, Connection } from "@solana/web3.js";
import { EventParser } from "@coral-xyz/anchor";
import { getProgram } from "../get-program";
import { rpc } from "../constant";

const execute = async (payload: { txHash: string; isTxInER: boolean }) => {
  const { isTxInER, txHash } = payload;

  let connection: Connection;

  if (isTxInER) {
    connection = new Connection(rpc.devnet.magicblockProvider);
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
  txHash: "2Keu7vhiWEwbGgZSPzXw3E4Vudc6KnzWfBoiHLCKSbVevVSzF3YkR49zqgo77WJnzPZmSdtcBRaucvwrWZ1KEwyN",
  isTxInER: true,
});
