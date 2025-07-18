use {
  crate::{
    common::{
      constant::system::OPERATOR_KEY, error::VertexError, event::CommitAndStartBillingEvent,
    },
    states::{validate_user_vault_had_delegated, UserVault},
  },
  anchor_lang::prelude::*,
  ephemeral_rollups_sdk::{anchor::commit, ephem::commit_and_undelegate_accounts},
};

pub fn process(ctx: Context<CommitAndStartBilling>) -> Result<()> {
  let user = ctx.accounts.user.key();
  let user_vault_info = ctx.accounts.user_vault.to_account_info();
  let user_vault_buffer_vec = ctx.accounts.user_vault.try_borrow_data().unwrap().to_vec();
  let mut user_vault_buffer = user_vault_buffer_vec.as_slice();
  let user_vault = UserVault::deserialize(&mut user_vault_buffer)?;

  validate_user_vault_had_delegated(&user_vault_info, &user_vault, user)?;

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
  /// CHECK: user_vault has delegated, check by manual parse data
  pub user_vault: AccountInfo<'info>,
}
