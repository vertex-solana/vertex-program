use {
  crate::{
    common::{constant::seeds_prefix, error::VertexError, event::WithdrawFeeEvent},
    states::SystemAuthority,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<WithdrawFee>, amount: u64) -> Result<()> {
  let system_authority = &mut ctx.accounts.system_authority;
  let remaining_lamports = system_authority.get_lamports() - system_authority.rent_lamports;

  if remaining_lamports < amount {
    return err!(VertexError::InsufficientFundsInSystemVault);
  }

  system_authority.sub_lamports(amount)?;
  ctx.accounts.destination.add_lamports(amount)?;

  emit!(WithdrawFeeEvent { amount });

  Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFee<'info> {
  #[account(mut)]
  pub operator: Signer<'info>,

  #[account(
    mut,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump,
  )]
  pub system_authority: Account<'info, SystemAuthority>,

  #[account(mut)]
  pub destination: SystemAccount<'info>,
}
