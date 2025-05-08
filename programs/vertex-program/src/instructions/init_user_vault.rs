use {
  crate::{
    common::{
      constant::{seeds_prefix, DISCRIMINATOR},
      event::InitUserVaultEvent,
    },
    states::UserVault,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<InitUserVault>) -> Result<()> {
  ctx.accounts.user_vault.set_inner(UserVault {
    owner: ctx.accounts.owner.key(),
    deposited_amount: 0,
    remaining_amount: 0,
  });

  emit!(InitUserVaultEvent {
    owner: ctx.accounts.owner.key(),
    user_vault: ctx.accounts.user_vault.key(),
  });

  Ok(())
}

#[derive(Accounts)]
pub struct InitUserVault<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    init,
    payer = owner,
    space = DISCRIMINATOR + UserVault::INIT_SPACE,
    seeds = [seeds_prefix::USER_VAULT, owner.key().as_ref()],
    bump
  )]
  pub user_vault: Account<'info, UserVault>,

  pub system_program: Program<'info, System>,
}
