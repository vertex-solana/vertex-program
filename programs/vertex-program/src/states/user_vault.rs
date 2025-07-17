use {crate::common::error::VertexError, anchor_lang::prelude::*};

const MAX_READ_DEBT: usize = 5;
const DEFAULT_INDEXER_ID: u64 = 0;
const DEFAULT_PRICE_PER_GB_LAMPORTS: u64 = 0;

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
  pub read_debts: [ReadDebt; MAX_READ_DEBT],
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

  pub fn find_or_add_read_debt(&mut self, indexer_id: u64) -> Result<&mut ReadDebt> {
    if let Some(read_debt_index) = self
      .read_debts
      .iter_mut()
      .position(|debt| debt.indexer_id == indexer_id)
    {
      Ok(&mut self.read_debts[read_debt_index])
    } else if let Some(read_debt_index) = self
      .read_debts
      .iter_mut()
      .position(|debt| debt.indexer_id == DEFAULT_INDEXER_ID)
    {
      let read_debt = &mut self.read_debts[read_debt_index];
      *read_debt = ReadDebt::new(indexer_id, DEFAULT_PRICE_PER_GB_LAMPORTS);
      Ok(read_debt)
    } else {
      msg!("User vault not have enough for read debt");
      err!(VertexError::ReadDebtLimit)
    }
  }
}

impl ReadDebt {
  pub fn new(indexer_id: u64, price_per_gb_lamports: u64) -> Self {
    Self {
      indexer_id,
      bytes_accumulated: 0,
      price_per_gb_lamports,
    }
  }
}
