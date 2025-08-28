import BN from "bn.js";
import { Display } from "./display";

interface ISystemAuthority {
  bump: number;
  rentLamports: BN;
}

export class SystemAuthority implements Display {
  private state: ISystemAuthority;

  constructor(data: ISystemAuthority) {
    this.state = data;
  }

  display(): void {
    console.log(
      [
        "System Authority {",
        `  bump        : ${this.state.bump}`,
        `  rentLamports: ${this.state.rentLamports.toString()}`,
        "}",
      ].join("\n")
    );
  }
}
