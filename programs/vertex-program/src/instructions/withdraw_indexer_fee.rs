use {
  crate::{
    common::{constant::seeds_prefix, error::VertexError, event::WithdrawIndexerFeeEvent},
    states::Indexer,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<WithdrawIndexerFee>, amount: u64) -> Result<()> {
  let indexer = &ctx.accounts.indexer;
  if indexer.get_lamports() - indexer.rent_lamports < amount {
    return err!(VertexError::InsufficientFundsInIndexerVault);
  }

  ctx.accounts.indexer.sub_lamports(amount)?;
  ctx.accounts.owner.add_lamports(amount)?;

  emit!(WithdrawIndexerFeeEvent {
    amount,
    indexer: ctx.accounts.indexer.key(),
    indexer_id: ctx.accounts.indexer.indexer_id,
    indexer_owner: ctx.accounts.owner.key(),
  });

  Ok(())
}

#[derive(Accounts)]
#[instruction(indexer_id: u64)]
pub struct WithdrawIndexerFee<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    mut,
    seeds = [seeds_prefix::INDEXER, owner.key().as_ref(), indexer_id.to_le_bytes().as_ref()],
    bump
  )]
  pub indexer: Account<'info, Indexer>,
}
