use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix},
      error::VertexError,
      event::WithdrawFeeEvent,
    },
    states::SystemAuthority,
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
  anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
  },
};

pub fn process(ctx: Context<WithdrawFee>, amount: u64) -> Result<()> {
  let system_authority = &mut ctx.accounts.system_authority;

  if system_authority.balance < amount {
    return err!(VertexError::InsufficientFundsInSystemVault);
  }

  let system_signer_seeds: &[&[&[u8]]] = &[&[
    seeds_prefix::SYSTEM_AUTHORITY,
    &[ctx.bumps.system_authority],
  ]];

  token_transfer::withdraw_fee(
    ctx.accounts.destination_ata.to_account_info(),
    system_authority.to_account_info(),
    system_signer_seeds,
    ctx.accounts.system_vault.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.mint.to_account_info(),
    ctx.accounts.mint.decimals,
    amount,
  )?;

  system_authority.balance -= amount;

  emit!(WithdrawFeeEvent { amount });

  Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFee<'info> {
  #[account(mut)]
  pub operator: Signer<'info>,

  #[account(
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee,
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    mut,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump,
  )]
  pub system_authority: Account<'info, SystemAuthority>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = system_authority,
  )]
  pub system_vault: InterfaceAccount<'info, TokenAccount>,

  #[account(mut)]
  pub destination: SystemAccount<'info>,

  #[account(
    init_if_needed,
    payer = operator,
    associated_token::mint = mint,
    associated_token::authority = destination,
  )]
  pub destination_ata: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,

  pub associated_token_program: Program<'info, AssociatedToken>,

  pub system_program: Program<'info, System>,
}
