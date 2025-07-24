import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VertexProgram } from "../target/types/vertex_program";
import {
  CREATOR_INDEXER_KEYPAIR,
  OPERATOR_KEYPAIR,
  READER_KEYPAIR,
} from "./accounts";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  initSystemVaultIx,
  initUserVaultIx,
  seeds,
  SystemAuthority,
} from "../sdk";
import { isNil } from "lodash";
import { assert } from "chai";
import { sendSolanaTransaction } from "./utils";
import { UserVault } from "../sdk/state/user-vault";

describe("vertex-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const providerEphemeralRollup = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.PROVIDER_ENDPOINT || "https://devnet.magicblock.app/",
      {
        wsEndpoint: process.env.WS_ENDPOINT || "wss://devnet.magicblock.app/",
      }
    ),
    anchor.Wallet.local()
  );

  console.log("\n========================================");
  console.log("         Loading Configuration");
  console.log("========================================\n");

  // @ts-ignore
  const providerWallet = provider.wallet.payer as Keypair;
  const connection = new Connection(provider.connection.rpcEndpoint);
  const ephemeralConnection = new Connection(
    providerEphemeralRollup.connection.rpcEndpoint
  );
  console.log("Base Connection: ", connection.rpcEndpoint);
  console.log("Ephemeral Rollup Connection: ", ephemeralConnection.rpcEndpoint);

  const program = anchor.workspace.VertexProgram as Program<VertexProgram>;
  const ephemeralProgram = new Program<VertexProgram>(
    program.idl,
    providerEphemeralRollup
  );

  const creatorIndexerKeypair = Keypair.fromSecretKey(
    Uint8Array.from(CREATOR_INDEXER_KEYPAIR)
  );
  const readerKeypair = Keypair.fromSecretKey(Uint8Array.from(READER_KEYPAIR));
  const operatorKeypair = Keypair.fromSecretKey(
    Uint8Array.from(OPERATOR_KEYPAIR)
  );
  console.log("========================================");
  console.log("           Accounts loaded");
  console.log("========================================");
  console.log(`  Provider Wallet : ${providerWallet.publicKey.toBase58()}`);
  console.log(`  ProgramId       : ${program.programId.toBase58()}`);
  console.log(
    `  Creator Indexer : ${creatorIndexerKeypair.publicKey.toBase58()}`
  );
  console.log(`  Reader          : ${readerKeypair.publicKey.toBase58()}`);
  console.log(`  Operator        : ${operatorKeypair.publicKey.toBase58()}`);
  console.log("========================================\n");

  before(async () => {
    // If running locally, airdrop SOL to the wallet.
    if (
      provider.connection.rpcEndpoint.includes("localhost") ||
      provider.connection.rpcEndpoint.includes("127.0.0.1")
    ) {
      // Airdrop to Creator
      await provider.connection.requestAirdrop(
        creatorIndexerKeypair.publicKey,
        100 * LAMPORTS_PER_SOL
      );

      // Airdrop to Reader
      await provider.connection.requestAirdrop(
        readerKeypair.publicKey,
        100 * LAMPORTS_PER_SOL
      );

      // Airdrop to Operator
      await provider.connection.requestAirdrop(
        operatorKeypair.publicKey,
        100 * LAMPORTS_PER_SOL
      );
    }
  });

  describe("Setup System Authority", () => {
    it("Success Initialize System Authority", async () => {
      const systemAuthorityAccount = PublicKey.findProgramAddressSync(
        seeds.systemAuthority(),
        program.programId
      )[0];

      const alreadyInitialized = await connection.getAccountInfo(
        systemAuthorityAccount
      );
      if (!isNil(alreadyInitialized)) {
        const parseSystemAuthority = program.coder.accounts.decode(
          "systemAuthority",
          alreadyInitialized.data
        );
        const systemAuthority = new SystemAuthority(parseSystemAuthority);
        systemAuthority.display();
        console.log("System Authority already initialized");
        return;
      } else {
        const tx = new Transaction();
        const ix = await initSystemVaultIx(connection, {
          accounts: {
            operator: operatorKeypair.publicKey,
            systemAuthority: systemAuthorityAccount,
            systemProgram: SystemProgram.programId,
          },
          params: {},
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection,
          payer: operatorKeypair,
          tx,
        });
        console.log("txHash: ", txHash);
        assert.isString(txHash);

        const systemAuthority = await program.account.systemAuthority.fetch(
          systemAuthorityAccount
        );
        assert.notEqual(systemAuthority, null);
        console.log(`System Authority: ${systemAuthority}`);
      }
    });

    xit("Throw error if system authority already initialized", async () => {
      // TODO
    });

    xit("Throw error if operator is not key key setup to init system authority", async () => {
      // TODO
    });
  });

  describe("User vault", () => {
    const validateUserVault = (userVault: UserVault, owner: PublicKey) => {
      assert.equal(userVault.state.owner.toBase58(), owner.toBase58());
      assert.equal(userVault.state.storageBytes.toNumber(), 0);
      assert.equal(userVault.state.storageBytesLastBilled.toNumber(), 0);
      assert.equal(userVault.state.readDebts.length, 5);
      assert.equal(userVault.state.billingStatus, null);
    };

    it("Success initialize user vault", async () => {
      const creatorIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];

      const alreadyInitializedCreatorIndexerVault =
        await connection.getAccountInfo(creatorIndexerVault);

      if (!isNil(alreadyInitializedCreatorIndexerVault)) {
        const parseUserVault = program.coder.accounts.decode(
          "userVault",
          alreadyInitializedCreatorIndexerVault.data
        );
        const userVault = new UserVault(parseUserVault);
        userVault.display();
        console.log(
          "Creator Indexer Vault already initialized, skipping initialization"
        );
      } else {
        const tx = new Transaction();
        const ix = await initUserVaultIx(connection, {
          accounts: {
            owner: creatorIndexerKeypair.publicKey,
            userVault: creatorIndexerVault,
            systemProgram: SystemProgram.programId,
          },
          params: {},
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection,
          payer: creatorIndexerKeypair,
          tx,
        });
        console.log("Init Creator Indexer Vault txHash: ", txHash);
        assert.isString(txHash);

        const userVaultData = await program.account.userVault.fetch(
          creatorIndexerVault
        );
        const userVault = new UserVault(userVaultData);
        validateUserVault(userVault, creatorIndexerKeypair.publicKey);
        console.log(userVault.display());
      }

      const readerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];

      const alreadyInitializedReaderVault = await connection.getAccountInfo(
        readerVault
      );

      if (!isNil(alreadyInitializedReaderVault)) {
        const parseUserVault = program.coder.accounts.decode(
          "userVault",
          alreadyInitializedReaderVault.data
        );
        const userVault = new UserVault(parseUserVault);
        userVault.display();
        console.log(
          "Reader Vault already initialized, skipping initialization"
        );
      } else {
        const tx = new Transaction();
        const ix = await initUserVaultIx(connection, {
          accounts: {
            owner: readerKeypair.publicKey,
            userVault: readerVault,
            systemProgram: SystemProgram.programId,
          },
          params: {},
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection,
          payer: readerKeypair,
          tx,
        });
        console.log("Init Reader Vault txHash: ", txHash);
        assert.isString(txHash);

        const userVaultData = await program.account.userVault.fetch(
          creatorIndexerVault
        );
        const userVault = new UserVault(userVaultData);
        validateUserVault(userVault, creatorIndexerKeypair.publicKey);
        console.log(userVault.display());
      }
    });

    it("Throw error if user vault already initialized", async () => {
      // TODO
    });
  });

  describe("Delegate User Vault", () => {});
});
