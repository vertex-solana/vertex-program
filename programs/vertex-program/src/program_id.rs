use anchor_lang::prelude::{pubkey, Pubkey};

cfg_if::cfg_if! {
  if #[cfg(feature = "mainnet")] {
    pub const PROGRAM_ID: Pubkey = pubkey!("ENQJbjpnrTJus45f5kUg5M2LN9Sozf7JfZ9nAV3GVNZD");
  } else if #[cfg(feature = "devnet")] {
    pub const PROGRAM_ID: Pubkey = pubkey!("AtanB6GFaMXuM8mBUgSJUMwtKEB7ii35LAUwAQwdEsFf");
  } else {
    pub const PROGRAM_ID: Pubkey = pubkey!("AtanB6GFaMXuM8mBUgSJUMwtKEB7ii35LAUwAQwdEsFf");
  }
}
