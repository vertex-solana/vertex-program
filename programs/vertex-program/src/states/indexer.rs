use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct Indexer {
  pub owner: Pubkey,
  pub bump: u8,
  pub indexer_id: u64,
  pub price_per_gb_lamports: u64,
}
