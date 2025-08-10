use {
  crate::{
    common::{
      constant::{
        seeds_prefix,
        system::{OPERATOR_KEY, THRESHOLD_PRICE_LAMPORTS},
      },
      error::VertexError,
      event::{StartBillingEvent, TrackUserActivityEvent},
    },
    states::{Indexer, UserVault, BILLING_PENDING},
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
  let user_vault = &mut ctx.accounts.user_vault;

  if user_vault.billing_status.is_some() {
    return err!(VertexError::UserVaultIsInBillingProcess);
  }

  let TrackUserActivityInput { indexer_id, bytes } = input;

  let is_update_read_debt = indexer_id.is_some();
  if is_update_read_debt {
    if ctx.accounts.indexer.is_none() {
      return err!(VertexError::RequireIndexer);
    }

    let indexer = ctx.accounts.indexer.as_ref().unwrap();

    update_read_debt(user_vault, indexer, indexer_id.unwrap(), bytes)?
  } else {
    update_storage(user_vault, bytes)?
  }

  let total_price_debt = user_vault.calculate_total_price_user_vault()?;
  if total_price_debt >= THRESHOLD_PRICE_LAMPORTS as f64 {
    user_vault.billing_status = Some(BILLING_PENDING);

    emit!(StartBillingEvent {
      user,
      user_vault: user_vault.key(),
    })
  }

  emit!(TrackUserActivityEvent {
    user,
    user_vault: user_vault.key(),
  });

  Ok(())
}

fn update_read_debt(
  user_vault: &mut UserVault,
  indexer: &Account<Indexer>,
  indexer_id: u64,
  bytes: u64,
) -> Result<()> {
  let read_debt = user_vault.find_or_add_read_debt(indexer_id)?;
  read_debt.bytes_accumulated = read_debt
    .bytes_accumulated
    .checked_add(bytes)
    .ok_or(VertexError::Overflow)?;

  read_debt.price_per_gb_lamports = indexer.price_per_gb_lamports;

  Ok(())
}

fn update_storage(user_vault: &mut UserVault, bytes: u64) -> Result<()> {
  user_vault.storage_bytes = user_vault
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

  #[account(
    mut,
    seeds = [seeds_prefix::USER_VAULT, user.key().as_ref()],
    bump,
  )]
  pub user_vault: Account<'info, UserVault>,

  pub indexer: Option<Account<'info, Indexer>>,
}
