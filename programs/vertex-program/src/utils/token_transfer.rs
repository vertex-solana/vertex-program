use ::{
  anchor_lang::{
    prelude::{AccountInfo, CpiContext},
    solana_program::{program::invoke_signed, system_instruction},
    Result,
  },
  anchor_spl::token_interface,
};

pub fn deposit_to_vault<'a>(
  source_deposit: AccountInfo<'a>,
  destination_deposit: AccountInfo<'a>,
  system_program: AccountInfo<'a>,
  amount: u64,
) -> Result<()> {
  let transfer_instruction =
    system_instruction::transfer(&source_deposit.key, &destination_deposit.key, amount);

  invoke_signed(
    &transfer_instruction,
    &[source_deposit, destination_deposit, system_program],
    &[],
  )?;

  Ok(())
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
