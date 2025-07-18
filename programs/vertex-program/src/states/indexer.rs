use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct Indexer {
  pub owner: Pubkey,
  pub bump: u8,
  pub indexer_id: u64,
  pub price_per_gb_lamports: u64,
  pub rent_lamports: u64,
}

impl Indexer {
  pub fn init(
    &mut self,
    indexer_id: u64,
    price_per_gb_lamports: u64,
    owner: Pubkey,
    bump: u8,
    rent_lamports: u64,
  ) {
    self.indexer_id = indexer_id;
    self.price_per_gb_lamports = price_per_gb_lamports;
    self.owner = owner;
    self.bump = bump;
    self.rent_lamports = rent_lamports;
  }
}
