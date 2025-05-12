import BN from "bn.js";

export const toLittleEndianBuffer64 = (n: number): Buffer => {
  const bn = new BN(n);
  return bn.toArrayLike(Buffer, "le", 8);
};
