use {
  crate::{
    common::{
      constant::{seeds_prefix, system::PRICE_PER_GB_STORAGE},
      error::VertexError,
    },
    program_id::PROGRAM_ID,
    utils::{magic_block, math::bytes_to_gb},
  },
  anchor_lang::prelude::*,
  std::ops::{Add, Mul},
};

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

  pub fn calculate_total_price_user_vault(&self) -> Result<f64> {
    let storage_fee = bytes_to_gb(self.storage_bytes).mul(PRICE_PER_GB_STORAGE as f64);
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

pub fn validate_user_vault_had_delegated(
  user_vault_info: &AccountInfo,
  user_vault: &UserVault,
  user: Pubkey,
) -> Result<()> {
  if !user_vault_info.owner.eq(&user) {
    return err!(VertexError::InvalidOwnerOfUserVault);
  }

  let user_vault_seeds = [seeds_prefix::USER_VAULT, user.as_ref()];
  let (user_vault_pubkey, user_vault_bump) =
    Pubkey::find_program_address(&user_vault_seeds, &PROGRAM_ID);
  if !user_vault_pubkey.eq(&user_vault_info.key()) || user_vault_bump != user_vault.bump {
    return err!(VertexError::WrongUserVault);
  }

  if !magic_block::is_pda_delegated(user_vault_info) {
    return err!(VertexError::UserVaultMustDelegated);
  }

  Ok(())
}
