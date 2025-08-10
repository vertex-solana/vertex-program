use ::anchor_lang::{
  prelude::AccountInfo,
  solana_program::{program::invoke_signed, system_instruction},
  Result,
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
