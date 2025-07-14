use anchor_lang::prelude::{pubkey, Pubkey};

cfg_if::cfg_if! {
  if #[cfg(feature = "staging")] {
    pub const PROGRAM_ID: Pubkey = pubkey!("ENQJbjpnrTJus45f5kUg5M2LN9Sozf7JfZ9nAV3GVNZD");
  } else if #[cfg(feature = "dev")] {
    pub const PROGRAM_ID: Pubkey = pubkey!("ENQJbjpnrTJus45f5kUg5M2LN9Sozf7JfZ9nAV3GVNZD");
  } else {
    pub const PROGRAM_ID: Pubkey = pubkey!("ENQJbjpnrTJus45f5kUg5M2LN9Sozf7JfZ9nAV3GVNZD");
  }
}
