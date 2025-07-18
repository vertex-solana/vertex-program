pub const DISCRIMINATOR: usize = 8;

pub mod seeds_prefix {
  pub const USER_VAULT: &[u8] = b"user_vault";
  pub const INDEXER: &[u8] = b"indexer";
  pub const SYSTEM_AUTHORITY: &[u8] = b"system_authority";
}

pub mod system {
  use anchor_lang::{prelude::Pubkey, pubkey, solana_program::native_token::LAMPORTS_PER_SOL};

  // TODO: Update operator key
  #[cfg(feature = "mainnet")]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");

  #[cfg(feature = "devnet")]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");

  #[cfg(all(not(feature = "mainnet"), not(feature = "devnet")))]
  pub const OPERATOR_KEY: Pubkey = pubkey!("2RFnSTt2tBApn6xHGZPr6ijSd1nsVCUU273gWWs3f4Rg");

  pub const PRICE_PER_GB_STORAGE: u64 = LAMPORTS_PER_SOL;

  pub const THRESHOLD_PRICE_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
}
