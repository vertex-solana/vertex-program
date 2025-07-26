use {
  crate::{
    common::{
      constant::system::OPERATOR_KEY, error::VertexError, event::CommitAndStartBillingEvent,
    },
    states::UserVault,
  },
  anchor_lang::prelude::*,
  ephemeral_rollups_sdk::{anchor::commit, ephem::commit_and_undelegate_accounts},
};

pub fn process(ctx: Context<CommitAndStartBilling>) -> Result<()> {
  let user = ctx.accounts.user.key();
  let user_vault = &ctx.accounts.user_vault;
  let user_vault_info = ctx.accounts.user_vault.to_account_info();

  if user_vault.billing_status.is_none() {
    return err!(VertexError::UserVaultNotTouchThreshold);
  }

  commit_and_undelegate_accounts(
    &ctx.accounts.operator,
    vec![&user_vault_info],
    &ctx.accounts.magic_context,
    &ctx.accounts.magic_program,
  )?;

  emit!(CommitAndStartBillingEvent {
    user_vault: ctx.accounts.user_vault.key(),
    user,
  });

  Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct CommitAndStartBilling<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  pub user: SystemAccount<'info>,

  #[account(mut)]
  pub user_vault: Account<'info, UserVault>,
}
