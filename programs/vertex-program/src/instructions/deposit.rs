use {
  crate::{
    common::{constant::seeds_prefix, error::VertexError, event::DepositToVaultEvent},
    states::UserVault,
    utils::token_transfer,
    ID,
  },
  anchor_lang::prelude::*,
};

pub fn process(ctx: Context<Deposit>, amount: u64) -> Result<()> {
  // The whole process is check the PDA that must match because we allow user deposit the fund to the vault even if the PDA is in ER
  let user = ctx.accounts.payer.key();
  let user_vault = {
    let user_vault_data = ctx.accounts.user_vault.try_borrow_data()?;
    let mut data: &[u8] = &user_vault_data;
    UserVault::try_deserialize(&mut data)?
  };
  msg!("user_vault: {:#?}", user_vault);

  if !user_vault.owner.eq(&user) {
    return err!(VertexError::WrongUserVault);
  }

  let (user_vault_pubkey, bump) = Pubkey::try_find_program_address(
    &[seeds_prefix::USER_VAULT.as_ref(), user_vault.owner.as_ref()],
    &ID,
  )
  .ok_or(error!(VertexError::WrongUserVault))?;

  if !user_vault_pubkey.eq(&ctx.accounts.user_vault.key()) {
    return err!(VertexError::WrongUserVault);
  }

  if user_vault.bump != bump {
    return err!(VertexError::WrongUserVault);
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
    // seeds = [seeds_prefix::USER_VAULT.as_ref(), user_vault.owner.as_ref()],
    // bump
  )]
  /// CHECK: checked in process
  pub user_vault: AccountInfo<'info>,

  pub system_program: Program<'info, System>,
}
