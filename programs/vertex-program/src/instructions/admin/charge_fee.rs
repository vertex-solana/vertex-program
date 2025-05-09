use {
  crate::{
    common::{
      constant::{seeds_prefix, system::OPERATOR_KEY},
      error::VertexError,
      event::ChargeFeeEvent,
    },
    states::{SystemAuthority, UserVault},
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
  anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface},
};

pub fn process(ctx: Context<ChargeFee>, amount: u64) -> Result<()> {
  let user_vault = &mut ctx.accounts.user_vault;

  if user_vault.remaining_amount < amount {
    return err!(VertexError::NotEnoughRemainingAmount);
  }

  let payer_vault_signer_seeds: &[&[&[u8]]] = &[&[
    seeds_prefix::USER_VAULT,
    user_vault.owner.as_ref(),
    &[ctx.bumps.user_vault],
  ]];

  token_transfer::charge_fee(
    user_vault.to_account_info(),
    ctx.accounts.user_vault_ata.to_account_info(),
    payer_vault_signer_seeds,
    ctx.accounts.system_vault.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.mint.to_account_info(),
    ctx.accounts.mint.decimals,
    amount,
  )?;

  user_vault.remaining_amount -= amount;
  ctx.accounts.system_authority.balance += amount;

  emit!(ChargeFeeEvent {
    amount,
    user: user_vault.owner.key(),
  });

  Ok(())
}

#[derive(Accounts)]
pub struct ChargeFee<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  pub user: SystemAccount<'info>,

  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    mut,
    seeds = [seeds_prefix::USER_VAULT, user.key().as_ref()],
    bump
  )]
  pub user_vault: Account<'info, UserVault>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = operator,
  )]
  pub user_vault_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump
  )]
  pub system_authority: Account<'info, SystemAuthority>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = system_authority,
  )]
  pub system_vault: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,
}
