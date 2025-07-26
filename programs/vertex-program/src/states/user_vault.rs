use {
  crate::{
    common::{constant::system::PRICE_PER_GB_STORAGE, error::VertexError},
    utils::math::bytes_to_gb,
  },
  anchor_lang::prelude::*,
  std::ops::{Add, Mul},
};

const MAX_READ_DEBT: usize = 5;
pub const DEFAULT_INDEXER_ID: u64 = 0;
const DEFAULT_PRICE_PER_GB_LAMPORTS: u64 = 0;

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Debug, Clone, Copy, PartialEq, Eq)]
pub enum BillingStatus {
  Pending = 0,
  Charged = 1,
}

#[account]
#[derive(Debug, InitSpace)]
pub struct UserVault {
  pub owner: Pubkey,
  pub bump: u8,
  pub storage_bytes: u64,
  pub storage_bytes_last_billed: u64,
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
    self.storage_bytes_last_billed = 0;
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

  pub fn calculate_total_price_user_vault(&self) -> Result<f64> {
    let storage_fee = bytes_to_gb(self.storage_bytes - self.storage_bytes_last_billed)
      .mul(PRICE_PER_GB_STORAGE as f64);
    let mut read_fee = 0_f64;

    for read_debt in self.read_debts.iter() {
      if read_debt.indexer_id != DEFAULT_INDEXER_ID {
        let fee =
          bytes_to_gb(read_debt.bytes_accumulated).mul(read_debt.price_per_gb_lamports as f64);
        read_fee = read_fee.add(fee);
      }
    }

    Ok(storage_fee.add(read_fee))
  }

  pub fn total_read_debts(&self) -> u64 {
    self
      .read_debts
      .iter()
      .filter(|debt| debt.indexer_id != DEFAULT_INDEXER_ID)
      .count() as u64
  }

  pub fn get_all_read_debts_active(&self) -> Vec<ReadDebt> {
    self
      .read_debts
      .iter()
      .filter(|debt| debt.indexer_id != DEFAULT_INDEXER_ID)
      .cloned()
      .collect()
  }

  pub fn refresh_read_debts(&mut self) {
    self.read_debts = [ReadDebt::default(); MAX_READ_DEBT];
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
