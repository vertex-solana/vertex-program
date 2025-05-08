use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct UserVault {
  pub owner: Pubkey,
  pub deposited_amount: u64,
  pub remaining_amount: u64,
}
