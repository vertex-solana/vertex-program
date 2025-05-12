pub const DISCRIMINATOR: usize = 8;

pub mod seeds_prefix {
  pub const USER_VAULT: &[u8] = b"user_vault";
  pub const INDEXER: &[u8] = b"indexer";
  pub const SYSTEM_AUTHORITY: &[u8] = b"system_authority";
}

pub mod fee {
  use anchor_lang::{prelude::Pubkey, pubkey};

  #[cfg(feature = "mainnet")]
  pub const TOKEN_FEE_KEY: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  #[cfg(not(feature = "mainnet"))]
  pub const TOKEN_FEE_KEY: Pubkey = pubkey!("bEinDkpqnDrKbYgJ9EuUD1x7MqZxbXb9U7bCoS92KvW");
}

pub mod system {
  use anchor_lang::{prelude::Pubkey, pubkey};

  // TODO: Update operator key
  #[cfg(feature = "mainnet")]
  pub const OPERATOR_KEY: Pubkey = pubkey!("3TmfTPbhV6QDsu6kTbdkFTYKNjJQoTwLHBcb65CE1M3U");

  #[cfg(not(feature = "mainnet"))]
  pub const OPERATOR_KEY: Pubkey = pubkey!("bN5TqUQXSV7UsjoEKNeYm2gm3Qcy3KzxngAvpXeXuz7");
}
