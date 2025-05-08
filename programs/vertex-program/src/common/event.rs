use anchor_lang::prelude::*;

#[event]
pub struct InitUserVaultEvent {
  pub owner: Pubkey,
  pub user_vault: Pubkey,
}

#[event]
pub struct DepositToVaultEvent {
  pub user: Pubkey,
  pub user_vault: Pubkey,
  pub amount: u64,
}

#[event]
pub struct InitIndexerEvent {
  pub owner: Pubkey,
  pub indexer: Pubkey,
  pub indexer_id: u64,
}

#[event]
pub struct TransferReadFeeEvent {
  pub indexer: Pubkey,
  pub indexer_owner: Pubkey,
  pub indexer_id: u64,
  pub amount: u64,
  pub payer: Pubkey,
}
