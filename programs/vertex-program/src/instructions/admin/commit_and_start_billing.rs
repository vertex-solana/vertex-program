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

  let user_vault = {
    let user_vault_data = ctx.accounts.user_vault.try_borrow_data()?;
    let mut data: &[u8] = &user_vault_data;
    UserVault::try_deserialize(&mut data)?
  };
  msg!("user_vault: {:#?}", user_vault);
  if !user_vault.owner.eq(&ctx.accounts.user.key()) {
    return err!(VertexError::WrongUserVault);
  }

  if user_vault.billing_status.is_none() {
    return err!(VertexError::UserVaultNotTouchThreshold);
  }

  commit_and_undelegate_accounts(
    &ctx.accounts.operator,
    vec![&ctx.accounts.user_vault.to_account_info()],
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
  /// CHECK:
  pub user_vault: AccountInfo<'info>,
}
