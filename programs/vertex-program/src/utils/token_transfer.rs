use ::{
  anchor_lang::{
    prelude::{AccountInfo, CpiContext},
    Result,
  },
  anchor_spl::token_interface,
};

pub fn deposit_fee_to_vault<'a>(
  source_deposit: AccountInfo<'a>,
  destination_deposit: AccountInfo<'a>,
  user_authority: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  mint_decimals: u8,
  amount: u64,
) -> Result<()> {
  token_interface::transfer_checked(
    CpiContext::new(
      token_program.clone(),
      token_interface::TransferChecked {
        from: source_deposit,
        to: destination_deposit,
        authority: user_authority,
        mint,
      },
    ),
    amount,
    mint_decimals,
  )
}

pub fn transfer_read_fee<'a>(
  payer_vault_authority: AccountInfo<'a>,
  payer_vault_ata: AccountInfo<'a>,
  payer_vault_signer_seeds: &[&[&[u8]]],
  indexer_vault: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  mint_decimals: u8,
  amount: u64,
) -> Result<()> {
  token_interface::transfer_checked(
    CpiContext::new_with_signer(
      token_program,
      token_interface::TransferChecked {
        from: payer_vault_ata,
        to: indexer_vault,
        authority: payer_vault_authority,
        mint,
      },
      payer_vault_signer_seeds,
    ),
    amount,
    mint_decimals,
  )
}

pub fn withdraw_indexer_fee<'a>(
  indexer_owner_ata: AccountInfo<'a>,
  indexer: AccountInfo<'a>,
  indexer_signer_seeds: &[&[&[u8]]],
  indexer_vault: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  mint_decimals: u8,
  amount: u64,
) -> Result<()> {
  token_interface::transfer_checked(
    CpiContext::new_with_signer(
      token_program,
      token_interface::TransferChecked {
        from: indexer_vault,
        to: indexer_owner_ata,
        authority: indexer,
        mint,
      },
      indexer_signer_seeds,
    ),
    amount,
    mint_decimals,
  )
}

pub fn charge_fee<'a>(
  payer_vault_authority: AccountInfo<'a>,
  payer_vault_ata: AccountInfo<'a>,
  payer_vault_signer_seeds: &[&[&[u8]]],
  system_vault: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  mint_decimals: u8,
  amount: u64,
) -> Result<()> {
  token_interface::transfer_checked(
    CpiContext::new_with_signer(
      token_program,
      token_interface::TransferChecked {
        from: payer_vault_ata,
        to: system_vault,
        authority: payer_vault_authority,
        mint,
      },
      payer_vault_signer_seeds,
    ),
    amount,
    mint_decimals,
  )
}

pub fn withdraw_fee<'a>(
  destination_ata: AccountInfo<'a>,
  system_authority: AccountInfo<'a>,
  system_signer_seeds: &[&[&[u8]]],
  system_vault: AccountInfo<'a>,
  token_program: AccountInfo<'a>,
  mint: AccountInfo<'a>,
  mint_decimals: u8,
  amount: u64,
) -> Result<()> {
  token_interface::transfer_checked(
    CpiContext::new_with_signer(
      token_program,
      token_interface::TransferChecked {
        from: system_vault,
        to: destination_ata,
        authority: system_authority,
        mint,
      },
      system_signer_seeds,
    ),
    amount,
    mint_decimals,
  )
}
