import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, keccak256, toBytes, toHex } from "viem";

describe("ProofNFT", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const name = await proofNFT.read.name();
      const symbol = await proofNFT.read.symbol();
      
      assert.equal(name, "ProofNFT");
      assert.equal(symbol, "PROOF");
    });

    it("Should set the deployer as owner", async function () {
      const [owner] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const contractOwner = await proofNFT.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should start with zero total supply", async function () {
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const totalSupply = await proofNFT.read.totalSupply();
      assert.equal(totalSupply, 0n);
    });
  });

  describe("Single Minting", function () {
    it("Should mint a token with correct hash", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const data = "sensitive_document_data";
      const hash = keccak256(toBytes(data));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const tokenId = 1n;
      
      // Verify ownership
      const tokenOwner = await proofNFT.read.ownerOf([tokenId]);
      assert.equal(tokenOwner.toLowerCase(), user1.account.address.toLowerCase());
      
      // Verify hash storage
      const storedHash = await proofNFT.read.getTokenHash([tokenId]);
      assert.equal(storedHash, hash);
      
      // Verify total supply
      const totalSupply = await proofNFT.read.totalSupply();
      assert.equal(totalSupply, 1n);
    });

    it("Should emit ProofMinted event", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const data = "test_data";
      const hash = keccak256(toBytes(data));
      
      await viem.assertions.emitWithArgs(
        proofNFT.write.ownerMintTo([user1.account.address, hash]),
        proofNFT,
        "ProofMinted",
        [getAddress(user1.account.address), 1n, hash]
      );
    });

    it("Should allow multiple tokens per address", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const data1 = "document_1";
      const data2 = "document_2";
      const hash1 = keccak256(toBytes(data1));
      const hash2 = keccak256(toBytes(data2));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash1]);
      await proofNFT.write.ownerMintTo([user1.account.address, hash2]);
      
      const balance = await proofNFT.read.balanceOf([user1.account.address]);
      const totalSupply = await proofNFT.read.totalSupply();
      
      assert.equal(balance, 2n);
      assert.equal(totalSupply, 2n);
    });

    it("Should revert when non-owner tries to mint", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const hash = keccak256(toBytes("data"));
      
      await assert.rejects(
        async () => {
          await proofNFT.write.ownerMintTo([user2.account.address, hash], {
            account: user1.account,
          });
        },
        {
          name: "Error",
        }
      );
    });

    it("Should revert when minting duplicate hash", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const hash = keccak256(toBytes("same_data"));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      await assert.rejects(
        async () => {
          await proofNFT.write.ownerMintTo([user2.account.address, hash]);
        },
        {
          name: "Error",
        }
      );
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint tokens to multiple addresses", async function () {
      const [owner, user1, user2, user3] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const recipients = [
        user1.account.address,
        user2.account.address,
        user3.account.address,
      ];
      
      const hashes = [
        keccak256(toBytes("data1")),
        keccak256(toBytes("data2")),
        keccak256(toBytes("data3")),
      ];
      
      await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
      
      // Verify each mint
      const owner1 = await proofNFT.read.ownerOf([1n]);
      const owner2 = await proofNFT.read.ownerOf([2n]);
      const owner3 = await proofNFT.read.ownerOf([3n]);
      
      assert.equal(owner1.toLowerCase(), recipients[0].toLowerCase());
      assert.equal(owner2.toLowerCase(), recipients[1].toLowerCase());
      assert.equal(owner3.toLowerCase(), recipients[2].toLowerCase());
      
      // Verify hashes
      const hash1 = await proofNFT.read.getTokenHash([1n]);
      const hash2 = await proofNFT.read.getTokenHash([2n]);
      const hash3 = await proofNFT.read.getTokenHash([3n]);
      
      assert.equal(hash1, hashes[0]);
      assert.equal(hash2, hashes[1]);
      assert.equal(hash3, hashes[2]);
      
      // Verify total supply
      const totalSupply = await proofNFT.read.totalSupply();
      assert.equal(totalSupply, 3n);
    });

    it("Should handle batch mint with same address multiple times", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const recipients = [user1.account.address, user1.account.address];
      const hashes = [
        keccak256(toBytes("data1")),
        keccak256(toBytes("data2")),
      ];
      
      await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
      
      const balance = await proofNFT.read.balanceOf([user1.account.address]);
      assert.equal(balance, 2n);
    });

    it("Should revert batch mint with empty arrays", async function () {
      const proofNFT = await viem.deployContract("ProofNFT");
      
      await assert.rejects(
        async () => {
          await proofNFT.write.ownerBatchMintTo([[], []]);
        },
        {
          name: "Error",
        }
      );
    });

    it("Should revert batch mint with mismatched array lengths", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const recipients = [user1.account.address];
      const hashes = [
        keccak256(toBytes("data1")),
        keccak256(toBytes("data2")),
      ];
      
      await assert.rejects(
        async () => {
          await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
        },
        {
          name: "Error",
        }
      );
    });
  });

  describe("Proof Verification", function () {
    it("Should verify correct proof", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const plainData = "my_secret_document";
      const hash = keccak256(toBytes(plainData));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const verified = await proofNFT.read.verifyProof([
        user1.account.address,
        1n,
        toHex(toBytes(plainData)),
      ]);
      
      assert.equal(verified, true);
    });

    it("Should reject verification with wrong data", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const correctData = "correct_data";
      const wrongData = "wrong_data";
      const hash = keccak256(toBytes(correctData));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const verified = await proofNFT.read.verifyProof([
        user1.account.address,
        1n,
        toHex(toBytes(wrongData)),
      ]);
      
      assert.equal(verified, false);
    });

    it("Should reject verification with wrong claimer", async function () {
      const [owner, user1, user2] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const plainData = "user1_data";
      const hash = keccak256(toBytes(plainData));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const verified = await proofNFT.read.verifyProof([
        user2.account.address,
        1n,
        toHex(toBytes(plainData)),
      ]);
      
      assert.equal(verified, false);
    });

    it("Should reject verification for non-existent token", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const verified = await proofNFT.read.verifyProof([
        user1.account.address,
        999n,
        toHex(toBytes("data")),
      ]);
      
      assert.equal(verified, false);
    });

    it("Should verify hash directly", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const data = "test_data";
      const hash = keccak256(toBytes(data));
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const verified = await proofNFT.read.verifyHash([1n, hash]);
      
      assert.equal(verified, true);
    });
  });

  describe("Server Model Integration", function () {
    it("Should mint all tokens from mocked server model", async function () {
      const [owner, user1, user2, user3] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      // Mock server model
      const serverModel = [
        {
          wallet: user1.account.address,
          data: ["national_id:123456789", "passport:AB123456"],
        },
        {
          wallet: user2.account.address,
          data: ["land_deed:lot_42_block_5"],
        },
        {
          wallet: user3.account.address,
          data: ["driver_license:DL987654", "medical_record:MR555123", "tax_id:TAX789456"],
        },
      ];
      
      let expectedTokenId = 1n;
      
      // Mint for each user in the model
      for (const user of serverModel) {
        for (const dataStr of user.data) {
          const hash = keccak256(toBytes(dataStr));
          await proofNFT.write.ownerMintTo([user.wallet, hash]);
          
          // Verify mint
          const tokenOwner = await proofNFT.read.ownerOf([expectedTokenId]);
          assert.equal(tokenOwner.toLowerCase(), user.wallet.toLowerCase());
          
          const storedHash = await proofNFT.read.getTokenHash([expectedTokenId]);
          assert.equal(storedHash, hash);
          
          expectedTokenId++;
        }
      }
      
      // Total should be 6 tokens (2 + 1 + 3)
      const totalSupply = await proofNFT.read.totalSupply();
      assert.equal(totalSupply, 6n);
    });

    it("Should batch mint all tokens from server model efficiently", async function () {
      const [owner, user1, user2, user3] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      // Mock server model
      const serverModel = [
        {
          wallet: user1.account.address,
          data: ["national_id:123456789", "passport:AB123456"],
        },
        {
          wallet: user2.account.address,
          data: ["land_deed:lot_42_block_5"],
        },
        {
          wallet: user3.account.address,
          data: ["driver_license:DL987654", "medical_record:MR555123", "tax_id:TAX789456"],
        },
      ];
      
      // Flatten the model into recipients and hashes arrays
      const recipients: `0x${string}`[] = [];
      const hashes: `0x${string}`[] = [];
      
      for (const user of serverModel) {
        for (const dataStr of user.data) {
          recipients.push(user.wallet);
          hashes.push(keccak256(toBytes(dataStr)));
        }
      }
      
      // Single batch mint call
      await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
      
      // Verify all mints
      const totalSupply = await proofNFT.read.totalSupply();
      assert.equal(totalSupply, BigInt(recipients.length));
      
      // Verify specific user balances
      const balance1 = await proofNFT.read.balanceOf([user1.account.address]);
      const balance2 = await proofNFT.read.balanceOf([user2.account.address]);
      const balance3 = await proofNFT.read.balanceOf([user3.account.address]);
      
      assert.equal(balance1, 2n);
      assert.equal(balance2, 1n);
      assert.equal(balance3, 3n);
    });

    it("Should verify proofs for all server model entries", async function () {
      const [owner, user1, user2, user3] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      // Mock server model
      const serverModel = [
        {
          wallet: user1.account.address,
          data: ["national_id:123456789", "passport:AB123456"],
        },
        {
          wallet: user2.account.address,
          data: ["land_deed:lot_42_block_5"],
        },
        {
          wallet: user3.account.address,
          data: ["driver_license:DL987654", "medical_record:MR555123", "tax_id:TAX789456"],
        },
      ];
      
      // Flatten and mint
      const recipients: `0x${string}`[] = [];
      const dataEntries: { wallet: `0x${string}`; raw: string }[] = [];
      
      for (const user of serverModel) {
        for (const dataStr of user.data) {
          recipients.push(user.wallet);
          dataEntries.push({ wallet: user.wallet, raw: dataStr });
        }
      }
      
      const hashes = dataEntries.map(e => keccak256(toBytes(e.raw)));
      
      await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
      
      // Verify each entry
      let tokenId = 1n;
      for (const entry of dataEntries) {
        const verified = await proofNFT.read.verifyProof([
          entry.wallet,
          tokenId,
          toHex(toBytes(entry.raw)),
        ]);
        
        assert.equal(verified, true);
        tokenId++;
      }
    });
  });

  describe("View Functions", function () {
    it("Should check if hash exists", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      const hash = keccak256(toBytes("test"));
      
      const existsBefore = await proofNFT.read.hashExists([hash]);
      assert.equal(existsBefore, false);
      
      await proofNFT.write.ownerMintTo([user1.account.address, hash]);
      
      const existsAfter = await proofNFT.read.hashExists([hash]);
      assert.equal(existsAfter, true);
    });

    it("Should return correct total supply", async function () {
      const [owner, user1] = await viem.getWalletClients();
      const proofNFT = await viem.deployContract("ProofNFT");
      
      let supply = await proofNFT.read.totalSupply();
      assert.equal(supply, 0n);
      
      await proofNFT.write.ownerMintTo([
        user1.account.address,
        keccak256(toBytes("1")),
      ]);
      supply = await proofNFT.read.totalSupply();
      assert.equal(supply, 1n);
      
      await proofNFT.write.ownerMintTo([
        user1.account.address,
        keccak256(toBytes("2")),
      ]);
      supply = await proofNFT.read.totalSupply();
      assert.equal(supply, 2n);
    });
  });
});
