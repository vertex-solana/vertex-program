use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix, DISCRIMINATOR},
      error::VertexError,
      event::InitIndexerEvent,
    },
    states::Indexer,
  },
  anchor_lang::prelude::*,
  anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
  },
};

pub fn process(ctx: Context<InitIndexer>, indexer_id: u64) -> Result<()> {
  let owner = &ctx.accounts.owner;

  ctx.accounts.indexer.set_inner(Indexer {
    owner: owner.key(),
    indexer_id,
    balance: 0,
  });

  emit!(InitIndexerEvent {
    owner: owner.key(),
    indexer: ctx.accounts.indexer.key(),
    indexer_id
  });

  Ok(())
}

#[derive(Accounts)]
#[instruction(indexer_id: u64)]
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

  #[account(
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    init,
    payer = owner,
    associated_token::mint = mint,
    associated_token::authority = indexer,
  )]
  pub indexer_vault: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,

  pub associated_token_program: Program<'info, AssociatedToken>,

  pub system_program: Program<'info, System>,
}
