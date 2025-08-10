use anchor_lang::prelude::*;

#[event]
pub struct InitSystemVaultEvent {
  pub system_authority: Pubkey,
}

#[event]
pub struct InitUserVaultEvent {
  pub owner: Pubkey,
  pub user_vault: Pubkey,
}

#[event]
pub struct DelegateUserVaultEvent {
  pub user_vault: Pubkey,
}

#[event]
pub struct DepositToVaultEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
  pub amount: u64,
}

#[event]
pub struct TrackUserActivityEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
}

#[event]
pub struct StartBillingEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
}

#[event]
pub struct CommitAndStartBillingEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
}

#[event]
pub struct InitIndexerEvent {
  pub owner: Pubkey,
  pub indexer: Pubkey,
  pub indexer_id: u64,
}

#[event]
pub struct WithdrawIndexerFeeEvent {
  pub indexer: Pubkey,
  pub indexer_owner: Pubkey,
  pub indexer_id: u64,
  pub amount: u64,
}

#[event]
pub struct ChargeFeeEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
  pub amount: u64,
}

#[event]
pub struct WithdrawFeeEvent {
  pub amount: u64,
}
