use anchor_lang::prelude::*;

mod instructions;
mod states;
use instructions::*;
mod common;
mod utils;

declare_id!("ENQJbjpnrTJus45f5kUg5M2LN9Sozf7JfZ9nAV3GVNZD");

#[program]
pub mod vertex_program {
  use super::*;

  pub fn init_system_vault(ctx: Context<InitSystemVault>) -> Result<()> {
    admin::init_system_vault::process(ctx)
  }

  pub fn init_user_vault(ctx: Context<InitUserVault>) -> Result<()> {
    init_user_vault::process(ctx)
  }

  pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    deposit::process(ctx, amount)
  }

  pub fn init_indexer(ctx: Context<InitIndexer>, indexer_id: u64) -> Result<()> {
    init_indexer::process(ctx, indexer_id)
  }

  pub fn transfer_read_fee(ctx: Context<TransferReadFee>, amount: u64) -> Result<()> {
    admin::transfer_read_fee::process(ctx, amount)
  }

  pub fn withdraw_indexer_fee(
    ctx: Context<WithdrawIndexerFee>,
    indexer_id: u64,
    amount: u64,
  ) -> Result<()> {
    withdraw_indexer_fee::process(ctx, indexer_id, amount)
  }

  pub fn charge_fee(ctx: Context<ChargeFee>, amount: u64) -> Result<()> {
    admin::charge_fee::process(ctx, amount)
  }

  pub fn withdraw_fee(ctx: Context<WithdrawFee>, amount: u64) -> Result<()> {
    admin::withdraw_fee::process(ctx, amount)
  }
}
