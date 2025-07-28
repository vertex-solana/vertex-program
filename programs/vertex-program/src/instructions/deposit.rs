use {
  crate::{
    common::{constant::seeds_prefix, error::VertexError, event::DepositToVaultEvent},
    program_id::PROGRAM_ID,
    states::UserVault,
    utils::token_transfer,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<Deposit>, amount: u64) -> Result<()> {
  let user_vault = &ctx.accounts.user_vault;

  if user_vault.to_account_info().owner.key() != PROGRAM_ID {
    msg!("User vault already delegated");

    return err!(VertexError::UserVaultHadDelegated);
  }

  if ctx.accounts.payer.lamports() < amount {
    return err!(VertexError::UserNotHaveEnoughAmountToDeposit);
  }

  token_transfer::deposit_to_vault(
    ctx.accounts.payer.to_account_info(),
    ctx.accounts.user_vault.to_account_info(),
    ctx.accounts.system_program.to_account_info(),
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

  pub system_program: Program<'info, System>,
}
