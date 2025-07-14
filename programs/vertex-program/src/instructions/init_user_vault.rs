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
  let owner = ctx.accounts.owner.key();
  let user_vault_bump = ctx.bumps.user_vault;

  let user_vault = &mut ctx.accounts.user_vault;
  let rent_lamports = user_vault.get_lamports();
  user_vault.init(owner, user_vault_bump, rent_lamports);

  emit!(InitUserVaultEvent {
    owner,
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
