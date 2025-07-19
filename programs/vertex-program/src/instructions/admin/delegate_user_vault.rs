use {
  crate::{
    common::{
      constant::{seeds_prefix, system::OPERATOR_KEY},
      error::VertexError,
      event::DelegateUserVaultEvent,
    },
    states::{BillingStatus, UserVault},
  },
  anchor_lang::prelude::*,
  ephemeral_rollups_sdk::{anchor::delegate, cpi::DelegateConfig},
};

pub fn process(ctx: Context<DelegateUserVault>) -> Result<()> {
  let user_vault = &ctx.accounts.user_vault;

  if user_vault
    .billing_status
    .is_some_and(|status| status == BillingStatus::Pending)
  {
    return err!(VertexError::UserVaultIsInBillingProcess);
  }

  ctx.accounts.delegate_user_vault(
    &ctx.accounts.operator,
    &[seeds_prefix::USER_VAULT, ctx.accounts.user.key().as_ref()],
    DelegateConfig::default(),
  )?;

  emit!(DelegateUserVaultEvent {
    user_vault: ctx.accounts.user_vault.key(),
  });

  Ok(())
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateUserVault<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  pub user: SystemAccount<'info>,

  #[account(
    mut,
    del,
    seeds = [seeds_prefix::USER_VAULT, user.key().as_ref()],
    bump = user_vault.bump,
    constraint = user_vault.owner == user.key() @ VertexError::WrongUserVault,
  )]
  pub user_vault: Account<'info, UserVault>,
}
