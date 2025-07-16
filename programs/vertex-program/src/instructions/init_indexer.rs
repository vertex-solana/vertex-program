use {
  crate::{
    common::{
      constant::{seeds_prefix, DISCRIMINATOR},
      event::InitIndexerEvent,
    },
    states::Indexer,
  },
  anchor_lang::prelude::*,
};

pub fn process(
  ctx: Context<InitIndexer>,
  indexer_id: u64,
  price_per_gb_lamports: u64,
) -> Result<()> {
  let owner = &ctx.accounts.owner;
  let bump = ctx.bumps.indexer;

  let indexer = &mut ctx.accounts.indexer;
  indexer.init(indexer_id, price_per_gb_lamports, owner.key(), bump);

  emit!(InitIndexerEvent {
    owner: owner.key(),
    indexer: ctx.accounts.indexer.key(),
    indexer_id
  });

  Ok(())
}

#[derive(Accounts)]
#[instruction(indexer_id: u64, price_per_gb_lamports: u64)]
pub struct InitIndexer<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    init,
    payer = owner,
    space = DISCRIMINATOR + Indexer::INIT_SPACE,
    seeds = [seeds_prefix::INDEXER, owner.key().as_ref(), indexer_id.to_le_bytes().as_ref()],
    bump
  )]
  pub indexer: Account<'info, Indexer>,

  pub system_program: Program<'info, System>,
}
