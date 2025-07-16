pub const DISCRIMINATOR: usize = 8;

pub mod seeds_prefix {
  pub const USER_VAULT: &[u8] = b"user_vault";
  pub const INDEXER: &[u8] = b"indexer";
  pub const SYSTEM_AUTHORITY: &[u8] = b"system_authority";
}

pub mod system {
  use anchor_lang::{prelude::Pubkey, pubkey};

  // TODO: Update operator key
  #[cfg(feature = "mainnet")]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");

  #[cfg(feature = "devnet")]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");

  #[cfg(all(not(feature = "mainnet"), not(feature = "devnet")))]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");
}
