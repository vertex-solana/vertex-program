use {
  crate::{
    common::{
      constant::{seeds_prefix, system::OPERATOR_KEY, DISCRIMINATOR},
      error::VertexError,
      event::InitSystemVaultEvent,
    },
    states::SystemAuthority,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<InitSystemVault>) -> Result<()> {
  let system_authority = &mut ctx.accounts.system_authority;
  let system_authority_bump = ctx.bumps.system_authority;
  let rent_lamports = system_authority.get_lamports();

  system_authority.init(system_authority_bump, rent_lamports);

  emit!(InitSystemVaultEvent {
    system_authority: ctx.accounts.system_authority.key(),
  });

  Ok(())
}

#[derive(Accounts)]
pub struct InitSystemVault<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  #[account(
    init,
    payer = operator,
    space = DISCRIMINATOR + SystemAuthority::INIT_SPACE,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump
  )]
  pub system_authority: Account<'info, SystemAuthority>,

  pub system_program: Program<'info, System>,
}
