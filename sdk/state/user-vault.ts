import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Display } from "./display";

interface IReadDebt {
  indexerId: BN;
  bytesAccumulated: BN;
  pricePerGbLamports: BN;
}

interface IUserVault {
  owner: PublicKey;
  bump: number;
  storageBytes: BN;
  storageBytesLastBilled: BN;
  readDebts: IReadDebt[];
  billingStatus: number;
  rentLamports: BN;
}

export class UserVault implements Display {
  state: IUserVault;

  constructor(data: IUserVault) {
    this.state = data;
  }

  display(): void {
    const {
      owner,
      bump,
      storageBytes,
      storageBytesLastBilled,
      readDebts,
      billingStatus,
      rentLamports,
    } = this.state;

    const readDebtStr =
      readDebts.length === 0
        ? "[]"
        : "[\n" +
          readDebts
            .map((debt, i) =>
              [
                `    {`,
                `      indexerId          : ${debt.indexerId.toString()}`,
                `      bytesAccumulated   : ${debt.bytesAccumulated.toString()}`,
                `      pricePerGbLamports : ${debt.pricePerGbLamports.toString()}`,
                `    }${i < readDebts.length - 1 ? "," : ""}`,
              ].join("\n")
            )
            .join("\n") +
          "\n  ]";

    console.log(
      [
        "User Vault {",
        `  owner                : ${owner.toBase58()}`,
        `  bump                 : ${bump}`,
        `  storageBytes         : ${storageBytes.toString()}`,
        `  storageBytesLastBilled: ${storageBytesLastBilled.toString()}`,
        `  readDebt             : ${readDebtStr}`,
        `  billingStatus        : ${billingStatus}`,
        `  rentLamports         : ${rentLamports.toString()}`,
        "}",
      ].join("\n")
    );
  }
}
