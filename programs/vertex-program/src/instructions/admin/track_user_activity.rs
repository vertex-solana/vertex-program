use {
  crate::{
    common::{
      constant::{seeds_prefix, system::OPERATOR_KEY},
      error::VertexError,
      event::TrackUserActivityEvent,
    },
    program_id::PROGRAM_ID,
    states::{user_vault, Indexer, UserVault},
    utils::magic_block,
  },
  anchor_lang::prelude::*,
};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct TrackUserActivityInput {
  pub indexer_id: Option<u64>,
  pub bytes: u64,
}

pub fn process(ctx: Context<TrackUserActivity>, input: TrackUserActivityInput) -> Result<()> {
  let user = ctx.accounts.user.key();
  let user_vault_info = ctx.accounts.user_vault.to_account_info();
  let user_vault_buffer_vec = ctx.accounts.user_vault.try_borrow_data().unwrap().to_vec();
  let mut user_vault_buffer = user_vault_buffer_vec.as_slice();
  let mut user_vault = UserVault::deserialize(&mut user_vault_buffer)?;

  validate_user_vault(&user_vault_info, &user_vault, user)?;

  let TrackUserActivityInput { indexer_id, bytes } = input;

  let is_update_read_debt = indexer_id.is_some();
  if is_update_read_debt {
    if ctx.accounts.indexer.is_none() {
      return err!(VertexError::RequireIndexer);
    }

    let indexer = ctx.accounts.indexer.as_ref().unwrap();

    update_read_debt(&mut user_vault, indexer, indexer_id.unwrap(), bytes)?
  } else {
    update_storage(&mut user_vault, bytes)?
  }

  user_vault.serialize(&mut &mut ctx.accounts.user_vault.data.borrow_mut()[..])?;

  emit!(TrackUserActivityEvent {
    user,
    user_vault: ctx.accounts.user_vault.key(),
  });

  Ok(())
}

fn validate_user_vault(
  user_vault_info: &AccountInfo,
  user_vault: &UserVault,
  user: Pubkey,
) -> Result<()> {
  if !user_vault_info.owner.eq(&user) {
    return err!(VertexError::InvalidOwnerOfUserVault);
  }

  let user_vault_seeds = [seeds_prefix::USER_VAULT, user.as_ref()];
  let (user_vault_pubkey, user_vault_bump) =
    Pubkey::find_program_address(&user_vault_seeds, &PROGRAM_ID);
  if !user_vault_pubkey.eq(&user_vault_info.key()) || user_vault_bump != user_vault.bump {
    return err!(VertexError::WrongUserVault);
  }

  if !magic_block::is_pda_delegated(user_vault_info) {
    return err!(VertexError::UserVaultMustDelegated);
  }

  Ok(())
}

fn update_read_debt(
  user_vault: &mut UserVault,
  indexer: &Account<Indexer>,
  indexer_id: u64,
  bytes: u64,
) -> Result<()> {
  let read_debt = user_vault.find_or_add_read_debt(indexer_id)?;
  read_debt
    .bytes_accumulated
    .checked_add(bytes)
    .ok_or(VertexError::Overflow)?;

  read_debt.price_per_gb_lamports = indexer.price_per_gb_lamports;

  Ok(())
}

fn update_storage(user_vault: &mut UserVault, bytes: u64) -> Result<()> {
  user_vault
    .storage_bytes
    .checked_add(bytes)
    .ok_or(VertexError::Overflow)?;

  Ok(())
}

#[derive(Accounts)]
pub struct TrackUserActivity<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  pub user: SystemAccount<'info>,

  #[account(mut)]
  /// CHECK: user_vault has delegated, check by manual parse data
  pub user_vault: AccountInfo<'info>,

  pub indexer: Option<Account<'info, Indexer>>,
}
