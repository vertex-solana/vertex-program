use {
  crate::{
    common::{
      constant::{fee::TOKEN_FEE_KEY, seeds_prefix},
      error::VertexError,
      event::DepositToVaultEvent,
    },
    states::UserVault,
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
  anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
  },
};

pub fn process(ctx: Context<Deposit>, amount: u64) -> Result<()> {
  if amount == 0 || amount > ctx.accounts.user_ata.amount {
    return err!(VertexError::InvalidAmountDeposit);
  }

  ctx.accounts.user_vault.deposited_amount += amount;
  ctx.accounts.user_vault.remaining_amount += amount;

  token_transfer::deposit_fee_to_vault(
    ctx.accounts.user_ata.to_account_info(),
    ctx.accounts.user_vault_ata.to_account_info(),
    ctx.accounts.payer.to_account_info(),
    ctx.accounts.token_program.to_account_info(),
    ctx.accounts.mint.to_account_info(),
    ctx.accounts.mint.decimals,
    amount,
  )?;

  emit!(DepositToVaultEvent {
    amount,
    user: ctx.accounts.payer.key(),
    user_vault: ctx.accounts.user_vault.key()
  });

  Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
    mut,
    seeds = [seeds_prefix::USER_VAULT.as_ref(), user_vault.owner.as_ref()],
    bump
  )]
  pub user_vault: Account<'info, UserVault>,

  #[account(
    constraint = mint.key() == TOKEN_FEE_KEY @ VertexError::WrongMintTokenFee
  )]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(
    mut,
    associated_token::mint = mint,
    associated_token::authority = payer,
  )]
  pub user_ata: InterfaceAccount<'info, TokenAccount>,

  #[account(
    init_if_needed,
    payer = payer,
    associated_token::mint = mint,
    associated_token::authority = user_vault,
  )]
  pub user_vault_ata: InterfaceAccount<'info, TokenAccount>,

  pub token_program: Interface<'info, TokenInterface>,

  pub associated_token_program: Program<'info, AssociatedToken>,

  pub system_program: Program<'info, System>,
}
