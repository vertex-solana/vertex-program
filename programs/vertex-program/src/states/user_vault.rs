use anchor_lang::prelude::*;

const MAX_READ_DEBT: usize = 5;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Debug, Clone)]
pub enum BillingStatus {
  Pending = 0,
  Charged = 1,
  Failed = 2,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct UserVault {
  pub owner: Pubkey,
  pub bump: u8,
  pub storage_bytes: u64,
  pub storage_last_billed_slot: u64,
  pub read_debts: [ReadDebt; 5],
  pub billing_status: Option<BillingStatus>,
  pub rent_lamports: u64,
}

#[derive(Debug, InitSpace, Clone, Copy, AnchorDeserialize, AnchorSerialize, Default)]
pub struct ReadDebt {
  pub indexer_id: u64,
  pub bytes_accumulated: u64,
  pub price_per_gb_lamports: u64,
}

impl UserVault {
  pub fn init(&mut self, owner: Pubkey, bump: u8, rent_lamports: u64) {
    self.owner = owner;
    self.bump = bump;
    self.storage_bytes = 0;
    self.storage_last_billed_slot = u64::try_from(Clock::get().unwrap().slot).unwrap();
    self.read_debts = [ReadDebt::default(); MAX_READ_DEBT];
    self.billing_status = None;
    self.rent_lamports = rent_lamports;
  }
}
