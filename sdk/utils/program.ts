import * as anchor from "@coral-xyz/anchor";
import { VertexProgram } from "../../target/types/vertex_program";
import vertexProgramJson from "../../target/idl/vertex_program.json";

export const getProgram = (connection: anchor.web3.Connection) => {
  return new anchor.Program<VertexProgram>(vertexProgramJson, {
    connection,
  });
};
