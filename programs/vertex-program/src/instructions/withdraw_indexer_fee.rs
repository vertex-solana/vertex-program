use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix},
      error::VertexError,
      event::WithdrawIndexerFeeEvent,
    },
    states::Indexer,
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
  anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface},
};

pub fn process(ctx: Context<WithdrawIndexerFee>, indexer_id: u64, amount: u64) -> Result<()> {
  let indexer = &ctx.accounts.indexer;
  let owner_key = ctx.accounts.owner.key();
  if indexer.balance < amount {
    return err!(VertexError::InsufficientFundsInIndexerVault);
  }

  let indexer_le_bytes = indexer_id.to_le_bytes();
  let indexer_signer_seeds: &[&[&[u8]]] = &[&[
    seeds_prefix::INDEXER,
    owner_key.as_ref(),
    indexer_le_bytes.as_ref(),
    &[ctx.bumps.indexer],
  ]];

  token_transfer::withdraw_indexer_fee(
    ctx.accounts.owner_ata.to_account_info(),
    indexer.to_account_info(),
    indexer_signer_seeds,
    ctx.accounts.indexer_vault.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.mint.to_account_info(),
    ctx.accounts.mint.decimals,
    amount,
  )?;

  ctx.accounts.indexer.balance -= amount;

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
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = owner,
  )]
  pub owner_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,
    seeds = [seeds_prefix::INDEXER, owner.key().as_ref(), indexer_id.to_le_bytes().as_ref()],
    bump
  )]
  pub indexer: Account<'info, Indexer>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = indexer,
  )]
  pub indexer_vault: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,
}
