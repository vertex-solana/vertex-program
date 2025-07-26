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
  TransactionInstruction,
} from "@solana/web3.js";
import {
  commitAndStartBillingIx,
  delegateUserVaultIx,
  Indexer,
  initIndexerIx,
  initSystemVaultIx,
  initUserVaultIx,
  seeds,
  SystemAuthority,
  trackUserActivityIx,
} from "../sdk";
import { isNil } from "lodash";
import { assert } from "chai";
import { getRandomInt, sendSolanaTransaction } from "./utils";
import { UserVault } from "../sdk/state/user-vault";
import { DELEGATION_PROGRAM_ID } from "@magicblock-labs/ephemeral-rollups-sdk";
import { BN } from "bn.js";
import { DEFAULT_INDEXER_ID } from "../sdk/common";

describe("vertex-program", async () => {
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
  const routerConnection = new anchor.web3.Connection(
    process.env.ROUTER_ENDPOINT || "https://devnet-router.magicblock.app",
    {
      wsEndpoint:
        process.env.ROUTER_WS_ENDPOINT || "wss://devnet-router.magicblock.app",
    }
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

    xit("Success initialize user vault", async () => {
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

    xit("Throw error if user vault already initialized", async () => {
      // TODO
    });
  });

  describe("Indexer", () => {
    it("Success initialize indexer", async () => {
      const indexerId = 1;
      const pricePerGbLamports = LAMPORTS_PER_SOL; // 1 SOL

      const indexerAccount = PublicKey.findProgramAddressSync(
        seeds.indexer(creatorIndexerKeypair.publicKey, indexerId),
        program.programId
      )[0];
      const indexerData = await connection.getAccountInfo(indexerAccount);
      if (indexerData) {
        console.log("Indexer already initialized, skipping initialization");
        return;
      }

      const tx = new Transaction();
      const ix = await initIndexerIx(connection, {
        accounts: {
          indexer: indexerAccount,
          owner: creatorIndexerKeypair.publicKey,
        },
        params: {
          indexerId: new BN(indexerId),
          pricePerGbLamports: new BN(pricePerGbLamports),
        },
      });
      tx.add(ix);

      const txHash = await sendSolanaTransaction({
        connection,
        payer: creatorIndexerKeypair,
        tx,
      });
      console.log("Init Indexer txHash: ", txHash);
      assert.isString(txHash);

      const indexerDataAfter = await program.account.indexer.fetch(
        indexerAccount
      );
      const indexer = new Indexer(indexerDataAfter);
      console.log(indexer.display());
      assert.isTrue(
        indexer.state.owner.equals(creatorIndexerKeypair.publicKey)
      );
      assert.equal(indexer.state.indexerId.toNumber(), indexerId);
      assert.equal(
        indexer.state.pricePerGbLamports.toNumber(),
        pricePerGbLamports
      );
    });
  });

  describe("Delegate User Vault", () => {
    it("Success delegate creator indexer vault", async () => {
      const createIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];

      const createIndexerVaultData = await connection.getAccountInfo(
        createIndexerVault
      );
      if (!createIndexerVaultData.owner.equals(program.programId)) {
        console.log(
          `Create Indexer Vault had delegated, Current Owner is ${createIndexerVaultData.owner.toBase58()}`
        );
      } else {
        const tx = new Transaction();
        const ix = await delegateUserVaultIx(connection, {
          accounts: {
            operator: operatorKeypair.publicKey,
            user: creatorIndexerKeypair.publicKey,
            userVault: createIndexerVault,
          },
          params: {},
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection,
          payer: operatorKeypair,
          tx,
        });
        console.log("Delegate Create Indexer Vault txHash: ", txHash);
        assert.isString(txHash);

        const userVaultDelegatedData = await connection.getAccountInfo(
          createIndexerVault
        );
        assert.isTrue(
          userVaultDelegatedData.owner.equals(DELEGATION_PROGRAM_ID)
        );
      }
    });

    it("Success delegate reader vault", async () => {
      const readerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];

      const readerVaultData = await connection.getAccountInfo(readerVault);
      if (!readerVaultData.owner.equals(program.programId)) {
        console.log(
          `Create Indexer Vault had delegated, Current Owner is ${readerVaultData.owner.toBase58()}`
        );
      } else {
        const tx = new Transaction();
        const ix = await delegateUserVaultIx(connection, {
          accounts: {
            operator: operatorKeypair.publicKey,
            user: readerKeypair.publicKey,
            userVault: readerVault,
          },
          params: {},
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection,
          payer: operatorKeypair,
          tx,
        });
        console.log("Delegate Reader Vault txHash: ", txHash);
        assert.isString(txHash);

        const userVaultDelegatedData = await connection.getAccountInfo(
          readerVault
        );
        assert.isTrue(
          userVaultDelegatedData.owner.equals(DELEGATION_PROGRAM_ID)
        );
      }
    });
  });

  describe("Deposit", () => {
    // TODO
  });

  describe("Track User Activity", () => {
    xit("Success update storage bytes usage", async () => {
      const createIndexerVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];

      const createIndexerVaultData = await connection.getAccountInfo(
        createIndexerVaultPubkey
      );

      if (!createIndexerVaultData.owner.equals(DELEGATION_PROGRAM_ID)) {
        console.log("Create Indexer Vault not delegated");
        return;
      }
      const userVaultDataAtERBefore =
        await ephemeralProgram.account.userVault.fetch(
          createIndexerVaultPubkey
        );

      const currentStorageBytes = new BN(100);

      const tx = new Transaction();
      const ix = await trackUserActivityIx(connection, {
        accounts: {
          indexer: null,
          operator: operatorKeypair.publicKey,
          user: creatorIndexerKeypair.publicKey,
          userVault: createIndexerVaultPubkey,
        },
        params: {
          bytes: currentStorageBytes,
          indexerId: null,
        },
      });
      tx.add(ix);

      const txHash = await sendSolanaTransaction({
        connection: ephemeralConnection,
        payer: operatorKeypair,
        tx,
      });
      console.log("Track User Activity txHash: ", txHash);
      assert.isString(txHash);

      const userVaultDataAtER = await ephemeralProgram.account.userVault.fetch(
        createIndexerVaultPubkey
      );

      assert.isTrue(
        userVaultDataAtER.storageBytes.eq(
          userVaultDataAtERBefore.storageBytes.add(currentStorageBytes)
        )
      );

      const userVault = new UserVault(userVaultDataAtER);
      userVault.display();
    });

    xit("Success update read debts to user vault", async () => {
      const indexerId = 1;
      const indexerAccount = PublicKey.findProgramAddressSync(
        seeds.indexer(creatorIndexerKeypair.publicKey, indexerId),
        program.programId
      )[0];
      const indexer = await program.account.indexer.fetch(indexerAccount);

      const readerVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];
      const readerVaultData = await connection.getAccountInfo(
        readerVaultPubkey
      );
      if (!readerVaultData.owner.equals(DELEGATION_PROGRAM_ID)) {
        console.log("Reader Vault not delegated, can not update read debts");
        return;
      } else {
        const readerVaultDataAtERBefore =
          await ephemeralProgram.account.userVault.fetch(readerVaultPubkey);
        const readDebtBefore = readerVaultDataAtERBefore.readDebts.find((r) =>
          r.indexerId.eq(indexer.indexerId)
        );

        const readBytes = new BN(100);

        const tx = new Transaction();
        const ix = await trackUserActivityIx(connection, {
          accounts: {
            indexer: indexerAccount,
            operator: operatorKeypair.publicKey,
            user: readerKeypair.publicKey,
            userVault: readerVaultPubkey,
          },
          params: {
            bytes: readBytes,
            indexerId: indexer.indexerId,
          },
        });
        tx.add(ix);

        const txHash = await sendSolanaTransaction({
          connection: ephemeralConnection,
          payer: operatorKeypair,
          tx,
        });
        console.log("Track User Activity txHash: ", txHash);
        assert.isString(txHash);

        const userVaultDataAtER =
          await ephemeralProgram.account.userVault.fetch(readerVaultPubkey);
        const userVault = new UserVault(userVaultDataAtER);
        userVault.display();

        const readDebt = userVaultDataAtER.readDebts.find((r) =>
          r.indexerId.eq(indexer.indexerId)
        );

        assert.isNotNull(readDebt);
        assert.isTrue(
          readDebt.pricePerGbLamports.eq(indexer.pricePerGbLamports)
        );
        assert.isTrue(
          readDebt.bytesAccumulated.eq(
            isNil(readDebtBefore)
              ? readBytes
              : readDebtBefore.bytesAccumulated.add(readBytes)
          )
        );
      }
    });

    xit("Throw error if maximum readDebts reached", async () => {
      const readerVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];

      const readerVaultAtERBefore =
        await ephemeralProgram.account.userVault.fetch(readerVaultPubkey);

      const totalReadDebtsAvailable = readerVaultAtERBefore.readDebts.filter(
        (r) => r.indexerId.eq(new BN(DEFAULT_INDEXER_ID))
      ).length;

      const indexerIds = [2, 3, 4, 5];
      const txInitIndexer = new Transaction();
      for (let i = 0; i < totalReadDebtsAvailable; i++) {
        const indexerId = indexerIds[i];
        const indexerPubkey = PublicKey.findProgramAddressSync(
          seeds.indexer(creatorIndexerKeypair.publicKey, indexerId),
          program.programId
        )[0];
        const indexerInfo = await connection.getAccountInfo(indexerPubkey);
        if (indexerInfo) {
          continue;
        } else {
          txInitIndexer.add(
            await initIndexerIx(connection, {
              accounts: {
                owner: creatorIndexerKeypair.publicKey,
                indexer: indexerPubkey,
              },
              params: {
                indexerId: new BN(indexerId),
                pricePerGbLamports: new BN(LAMPORTS_PER_SOL),
              },
            })
          );
        }
      }

      if (txInitIndexer.instructions.length > 0) {
        const txHash = await sendSolanaTransaction({
          connection: connection,
          payer: creatorIndexerKeypair,
          tx: txInitIndexer,
        });
        console.log("Init Indexers txHash: ", txHash);
      }
      const txTrackUserActivity = new Transaction();
      const readBytes = new BN(100);
      for (let i = 0; i < totalReadDebtsAvailable; i++) {
        const indexerId = new BN(indexerIds[i]);
        const indexerAccount = PublicKey.findProgramAddressSync(
          seeds.indexer(creatorIndexerKeypair.publicKey, indexerId.toNumber()),
          program.programId
        )[0];

        txTrackUserActivity.add(
          await trackUserActivityIx(connection, {
            accounts: {
              indexer: indexerAccount,
              operator: operatorKeypair.publicKey,
              user: readerKeypair.publicKey,
              userVault: readerVaultPubkey,
            },
            params: {
              bytes: readBytes,
              indexerId,
            },
          })
        );
      }

      let txHash = await sendSolanaTransaction({
        connection: ephemeralConnection,
        payer: operatorKeypair,
        tx: txTrackUserActivity,
      });
      console.log("Track User Activity txHash: ", txHash);

      const userVaultDataAtER = await ephemeralProgram.account.userVault.fetch(
        readerVaultPubkey
      );
      const userVault = new UserVault(userVaultDataAtER);
      userVault.display();

      const newIndexerId = new BN(100);
      const indexerPubkey = PublicKey.findProgramAddressSync(
        seeds.indexer(creatorIndexerKeypair.publicKey, newIndexerId.toNumber()),
        program.programId
      )[0];
      const newIndexerInfo = await connection.getAccountInfo(indexerPubkey);
      if (!newIndexerInfo) {
        const txInitIndexer = new Transaction();
        txInitIndexer.add(
          await initIndexerIx(connection, {
            accounts: {
              owner: creatorIndexerKeypair.publicKey,
              indexer: indexerPubkey,
            },
            params: {
              indexerId: newIndexerId,
              pricePerGbLamports: new BN(LAMPORTS_PER_SOL),
            },
          })
        );
        txHash = await sendSolanaTransaction({
          connection: connection,
          payer: creatorIndexerKeypair,
          tx: txInitIndexer,
        });
        console.log("Init New Indexers txHash: ", txHash);
      }

      const txTrackUserActivity2 = new Transaction();
      txTrackUserActivity2.add(
        await trackUserActivityIx(connection, {
          accounts: {
            indexer: indexerPubkey,
            operator: operatorKeypair.publicKey,
            user: readerKeypair.publicKey,
            userVault: readerVaultPubkey,
          },
          params: {
            bytes: readBytes,
            indexerId: newIndexerId,
          },
        })
      );

      try {
        await sendSolanaTransaction({
          connection: ephemeralConnection,
          payer: operatorKeypair,
          tx: txTrackUserActivity2,
        });
      } catch (error) {
        assert.include(JSON.stringify(error), "Read debt limit");
      }
    });

    xit("Success update status Billing when touch to threshold", async () => {
      let byteStorage = 100_000_000;
      const readerVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];

      const readerVaultInfo = await connection.getAccountInfo(
        readerVaultPubkey
      );
      const readerVaultAccount = await program.account.userVault.fetch(
        readerVaultPubkey
      );

      if (!readerVaultInfo) {
        throw Error("Reader vault not initialized");
      }

      if (!readerVaultInfo.owner.equals(DELEGATION_PROGRAM_ID)) {
        throw Error("Reader vault not delegated");
      }

      if (!isNil(readerVaultAccount.billingStatus)) {
        console.log("User vault already in Billing process can not update");
        return;
      }

      const tx = new Transaction();
      tx.add(
        await trackUserActivityIx(connection, {
          accounts: {
            indexer: null,
            operator: operatorKeypair.publicKey,
            user: readerKeypair.publicKey,
            userVault: readerVaultPubkey,
          },
          params: {
            indexerId: null,
            bytes: new BN(byteStorage),
          },
        })
      );

      const txHash = await sendSolanaTransaction({
        connection: ephemeralConnection,
        payer: operatorKeypair,
        tx: tx,
      });
      console.log("Track User Activity txHash: ", txHash);

      const userVaultDataAfter = await ephemeralProgram.account.userVault.fetch(
        readerVaultPubkey
      );
      const userVaultAfter = new UserVault(userVaultDataAfter);
      userVaultAfter.display();
    });

    it("Throw error when update user activity if user vault already in Billing process", async () => {
      // TODO
    });
  });

  describe("Commit and Start Billing", async () => {
    it("Success commit and start billing for User Vault touch to Billing Threshold", async () => {
      const readerVaultPubkey = PublicKey.findProgramAddressSync(
        seeds.userVault(readerKeypair.publicKey),
        program.programId
      )[0];
      console.log("🚀 ~ readerVaultPubkey:", readerVaultPubkey.toBase58())

      const readerVaultInfo = await connection.getAccountInfo(
        readerVaultPubkey
      );
      const readVaultBeforeData = await ephemeralProgram.account.userVault.fetch(
        readerVaultPubkey
      );
      const readerVaultBefore = new UserVault(readVaultBeforeData);
      console.log("Reader Vault data at base chain: ");
      readerVaultBefore.display();

      if (!readerVaultInfo.owner.equals(DELEGATION_PROGRAM_ID)) {
        console.log("Reader vault not delegated");
        return;
      }

      const tx = new Transaction();
      tx.add(
        await commitAndStartBillingIx(connection, {
          accounts: {
            operator: operatorKeypair.publicKey,
            user: readerKeypair.publicKey,
            userVault: readerVaultPubkey,
          },
          params: {},
        })
      );

      const txHash = await sendSolanaTransaction({
        connection: ephemeralConnection,
        payer: operatorKeypair,
        tx: tx,
      });
      console.log("Commit and Start Billing txHash In ER: ", txHash);

      const userVaultDataAtER = await ephemeralConnection.getAccountInfo(
        readerVaultPubkey
      );
      console.log("🚀 ~ userVaultDataAtER:", userVaultDataAtER);
      const userVaultAtBaseChainData = await program.account.userVault.fetch(
        readerVaultPubkey
      );
      const userVaultAtBaseChain = new UserVault(userVaultAtBaseChainData);
      userVaultAtBaseChain.display();
    });
  });
});
