use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix, DISCRIMINATOR},
      error::VertexError,
      event::InitSystemVaultEvent,
    },
    states::SystemAuthority,
  },
  anchor_lang::prelude::*,
  anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
  },
};

pub fn process(ctx: Context<InitSystemVault>) -> Result<()> {
  ctx
    .accounts
    .system_authority
    .set_inner(SystemAuthority { balance: 0 });

  emit!(InitSystemVaultEvent {
    system_authority: ctx.accounts.system_authority.key(),
    system_vault: ctx.accounts.system_vault.key(),
  });

  Ok(())
}

#[derive(Accounts)]
pub struct InitSystemVault<'info> {
  #[account(mut)]
  pub operator: Signer<'info>,

  #[account(
    init,
    payer = operator,
    space = DISCRIMINATOR + SystemAuthority::INIT_SPACE,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump
  )]
  pub system_authority: Account<'info, SystemAuthority>,

  #[account(
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    init,
    payer = operator,
    associated_token::mint = mint,
    associated_token::authority = system_authority
  )]
  pub system_vault: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,

  pub associated_token_program: Program<'info, AssociatedToken>,

  pub system_program: Program<'info, System>,
}
