import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Display } from "./display";

export interface IIndexer {
  owner: PublicKey;
  bump: number;
  indexerId: BN;
  pricePerGbLamports: BN;
  rentLamports: BN;
}

export class Indexer implements Display {
  state: IIndexer;
  
  constructor(data: IIndexer) {
    this.state = data;
  }

  display(): void {
    console.log(
      [
        "Indexer {",
        `  owner              : ${this.state.owner.toString()}`,
        `  bump               : ${this.state.bump}`,
        `  indexerId          : ${this.state.indexerId.toString()}`,
        `  pricePerGbLamports : ${this.state.pricePerGbLamports.toString()}`,
        `  rentLamports       : ${this.state.rentLamports.toString()}`,
        "}",
      ].join("\n")
    );
  }
}
