use {anchor_lang::prelude::*, ephemeral_rollups_sdk::consts::DELEGATION_PROGRAM_ID};

pub fn is_pda_delegated(pda_account_info: &AccountInfo) -> bool {
  return pda_account_info.owner.eq(&DELEGATION_PROGRAM_ID);
}
