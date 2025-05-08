use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix, system},
      error::VertexError,
      event::TransferReadFeeEvent,
    },
    states::{Indexer, UserVault},
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
  anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface},
};

pub fn process(ctx: Context<TransferReadFee>, amount: u64) -> Result<()> {
  let payer_vault = &ctx.accounts.payer_vault;

  if payer_vault.remaining_amount < amount {
    return err!(VertexError::NotEnoughRemainingAmount);
  }

  let payer_vault_signer_seeds: &[&[&[u8]]] =
    &[&[seeds_prefix::USER_VAULT, payer_vault.owner.as_ref()]];

  token_transfer::transfer_read_fee(
    ctx.accounts.payer_vault.to_account_info(),
    ctx.accounts.payer_vault_ata.to_account_info(),
    payer_vault_signer_seeds,
    ctx.accounts.indexer_vault.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.mint.to_account_info(),
    ctx.accounts.mint.decimals,
    amount,
  )?;

  ctx.accounts.indexer.balance += amount;
  ctx.accounts.payer_vault.remaining_amount -= amount;

  emit!(TransferReadFeeEvent {
    amount,
    indexer: ctx.accounts.indexer.key(),
    indexer_owner: ctx.accounts.indexer_owner.key(),
    indexer_id: ctx.accounts.indexer.indexer_id,
    payer: ctx.accounts.payer_vault.owner.key(),
  });

  Ok(())
}

#[derive(Accounts)]
#[instruction(indexer_id: u64)]
pub struct TransferReadFee<'info> {
  #[account(
    mut,
    constraint = operator.key() == system::OPERATOR_KEY @ VertexError::InvalidOperator
  )]
  pub operator: Signer<'info>,

  #[account(
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  pub indexer_owner: SystemAccount<'info>,

  #[account(
    seeds = [seeds_prefix::INDEXER, indexer_owner.key().as_ref(), indexer_id.to_le_bytes().as_ref()],
    bump
  )]
  pub indexer: Account<'info, Indexer>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = indexer,
  )]
  pub indexer_vault: InterfaceAccount<'info, TokenAccount>,

  #[account(mut)]
  pub payer_vault: Account<'info, UserVault>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = payer_vault,
  )]
  pub payer_vault_ata: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,
}
