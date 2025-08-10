import * as anchor from "@coral-xyz/anchor";
import { VertexProgram } from "../target/types/vertex_program";
import vertexProgramJson from "../target/idl/vertex_program.json";
import { Connection } from "@solana/web3.js";

export const getProgram = (connection: Connection) => {
  return new anchor.Program<VertexProgram>(vertexProgramJson, {
    connection: new anchor.web3.Connection(connection.rpcEndpoint),
  });
};
