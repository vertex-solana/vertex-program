use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct Indexer {
  pub owner: Pubkey,
  pub balance: u64,
  pub indexer_id: u64,
}
