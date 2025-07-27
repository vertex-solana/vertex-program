use {
  crate::{
    common::{
      constant::{
        seeds_prefix,
        system::{OPERATOR_KEY, PRICE_PER_GB_STORAGE},
      },
      error::VertexError,
      event::ChargeFeeEvent,
    },
    states::{Indexer, ReadDebt, SystemAuthority, UserVault, BILLING_CHARGED, DEFAULT_INDEXER_ID},
    utils::math::bytes_to_gb,
  },
  anchor_lang::prelude::*,
  std::ops::{Add, Mul},
};

pub fn process<'info>(ctx: Context<'_, '_, 'info, 'info, ChargeFee<'info>>) -> Result<()> {
  let user_vault = &mut ctx.accounts.user_vault;
  if !user_vault.is_in_billing_process() {
    return err!(VertexError::UserVaultNotInBillingProcess);
  }

  let total_fee_debt = user_vault.calculate_total_price_user_vault()?;

  let remaining_lamports = user_vault.get_lamports() - user_vault.rent_lamports;
  if total_fee_debt > remaining_lamports as f64 {
    msg!(
      "User vault not have enough for charge fee, remaining_lamports: {}, total_fee_debt: {}",
      remaining_lamports,
      total_fee_debt
    );
    return err!(VertexError::InsufficientFundsInUserVaultForChargeFee);
  }

  let total_read_debts = user_vault.total_read_debts();
  if ctx.remaining_accounts.len() != total_read_debts as usize {
    return err!(VertexError::NotEnoughRemainingAccountReadDebt);
  }
  let read_debts = user_vault.get_all_read_debts_active();

  let mut total_amount_transfer: u64 = 0;

  let indexer_accounts: Vec<Account<'info, Indexer>> = ctx
    .remaining_accounts
    .iter()
    .take(total_read_debts as usize)
    .map(|account_info| {
      let indexer =
        Account::<Indexer>::try_from(account_info).map_err(|_| VertexError::InvalidAccountData)?;
      if indexer.indexer_id == DEFAULT_INDEXER_ID {
        return err!(VertexError::InvalidIndexer);
      }
      Ok(indexer)
    })
    .collect::<Result<Vec<_>>>()?;

  let mut indexer_remaining_accounts = indexer_accounts.into_iter();

  for (index, read_debt) in read_debts.iter().enumerate() {
    let indexer_account: Account<'info, Indexer> = indexer_remaining_accounts
      .next()
      .ok_or(error!(VertexError::InvalidAccountData))?;

    check_read_debt_and_indexer(read_debt, &indexer_account, index)?;

    let fee =
      bytes_to_gb(read_debt.bytes_accumulated).mul(read_debt.price_per_gb_lamports as f64) as u64;
    user_vault.sub_lamports(fee)?;
    **ctx
      .remaining_accounts
      .get(index)
      .unwrap()
      .try_borrow_mut_lamports()? += fee;

    total_amount_transfer = total_amount_transfer.add(fee);
  }

  let total_lamports_transfer_to_system =
    bytes_to_gb(user_vault.storage_bytes - user_vault.storage_bytes_last_billed)
      .mul(PRICE_PER_GB_STORAGE as f64) as u64;
  user_vault.sub_lamports(total_lamports_transfer_to_system)?;
  ctx
    .accounts
    .system_authority
    .add_lamports(total_lamports_transfer_to_system)?;
  user_vault.storage_bytes_last_billed = user_vault.storage_bytes;

  total_amount_transfer = total_amount_transfer.add(total_lamports_transfer_to_system);

  user_vault.billing_status = Some(BILLING_CHARGED);
  user_vault.refresh_read_debts();

  emit!(ChargeFeeEvent {
    user: ctx.accounts.user.key(),
    user_vault: ctx.accounts.user_vault.key(),
    amount: total_amount_transfer,
  });

  Ok(())
}

#[derive(Accounts)]
pub struct ChargeFee<'info> {
  #[account(
    mut,
    constraint = operator.key() == OPERATOR_KEY @ VertexError::InvalidOperator,
  )]
  pub operator: Signer<'info>,

  pub user: SystemAccount<'info>,

  #[account(
    mut,
    seeds = [seeds_prefix::USER_VAULT, user.key().as_ref()],
    bump
  )]
  pub user_vault: Account<'info, UserVault>,

  #[account(
    mut,
    seeds = [seeds_prefix::SYSTEM_AUTHORITY],
    bump
  )]
  pub system_authority: Account<'info, SystemAuthority>,
}

fn check_read_debt_and_indexer(
  read_debt: &ReadDebt,
  indexer: &Indexer,
  index: usize,
) -> Result<()> {
  if read_debt.indexer_id != indexer.indexer_id {
    msg!("Read debt {} not match with indexer provider", index);
    return err!(VertexError::InvalidIndexer);
  }

  Ok(())
}
