use anchor_lang::prelude::*;

mod instructions;
mod states;
use instructions::*;
mod common;
mod utils;

declare_id!("9bRE8rbemawE439Fyh91LSnG83hrsSaGg4pjuJ7CpEPT");

#[program]
pub mod vertex_program {
  use super::*;

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
}
