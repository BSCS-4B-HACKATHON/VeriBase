import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("LandOwnershipNFT", function () {
  async function deployLandOwnershipNFTFixture() {
    const [owner, addr1, addr2, addr3] = await hre.viem.getWalletClients();
    const landOwnershipNFT = await hre.viem.deployContract("LandOwnershipNFT");
    const publicClient = await hre.viem.getPublicClient();

    return { landOwnershipNFT, owner, addr1, addr2, addr3, publicClient };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { landOwnershipNFT } = await deployLandOwnershipNFTFixture();

      expect(await landOwnershipNFT.read.name()).to.equal(
        "Land Ownership Proof"
      );
      expect(await landOwnershipNFT.read.symbol()).to.equal("LAND");
    });

    it("Should set the deployer as owner", async function () {
      const { landOwnershipNFT, owner } = await deployLandOwnershipNFTFixture();

      expect(await landOwnershipNFT.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("Minting", function () {
    it("Should mint a Land Ownership NFT successfully", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property Deed #123",
        "QmLandTest123",
        "0xlandhash123",
        "0xlandsig123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      expect(
        await landOwnershipNFT.read.balanceOf([addr1.account.address])
      ).to.equal(1n);
    });

    it("Should allow multiple Land NFTs to same wallet", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      // Mint first land NFT
      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property 1",
        "QmLand1",
        "0xhash1",
        "0xsig1",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      // Mint second land NFT - should succeed
      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property 2",
        "QmLand2",
        "0xhash2",
        "0xsig2",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      expect(
        await landOwnershipNFT.read.balanceOf([addr1.account.address])
      ).to.equal(2n);
    });

    it("Should add files to token", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property Deed",
        "QmTest123",
        "0xhash123",
        "0xsig123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      // Get the first token
      const tokenId = 1n;

      await landOwnershipNFT.write.addFileToToken([
        tokenId,
        "QmFile123",
        "deed.pdf",
        "application/pdf",
        2048n,
        "iv123",
        "hash123",
        "tag123",
      ]);

      const metadata = await landOwnershipNFT.read.getMetadata([tokenId]);
      expect(metadata.files.length).to.equal(1);
      expect(metadata.files[0].filename).to.equal("deed.pdf");
    });
  });

  describe("Transfers via Contract", function () {
    it("Should prevent direct transfers", async function () {
      const { landOwnershipNFT, addr1, addr2 } =
        await deployLandOwnershipNFTFixture();

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property",
        "QmTest",
        "0xhash",
        "0xsig",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = 1n;

      // Try direct transfer - should fail
      await expect(
        landOwnershipNFT.write.transferFrom(
          [addr1.account.address, addr2.account.address, tokenId],
          { account: addr1.account }
        )
      ).to.be.rejectedWith("DirectTransferNotAllowed");
    });

    it("Should set authorized contract", async function () {
      const { landOwnershipNFT, owner, addr1 } =
        await deployLandOwnershipNFTFixture();

      // Deploy a mock transfer contract (using addr1 as mock)
      const mockContract = addr1.account.address;

      await landOwnershipNFT.write.setAuthorizedContract([mockContract]);

      expect(await landOwnershipNFT.read.authorizedContract()).to.equal(
        getAddress(mockContract)
      );
    });

    it("Should only allow owner to set authorized contract", async function () {
      const { landOwnershipNFT, addr1, addr2 } =
        await deployLandOwnershipNFTFixture();

      await expect(
        landOwnershipNFT.write.setAuthorizedContract([addr2.account.address], {
          account: addr1.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Token Queries", function () {
    it("Should return all token IDs for a wallet", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      // Mint 3 tokens
      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property 1",
        "Qm1",
        "0xh1",
        "0xs1",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property 2",
        "Qm2",
        "0xh2",
        "0xs2",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property 3",
        "Qm3",
        "0xh3",
        "0xs3",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenIds = await landOwnershipNFT.read.getTokenIdsByWallet([
        addr1.account.address,
      ]);

      expect(tokenIds.length).to.equal(3);
      expect(tokenIds[0]).to.equal(1n);
      expect(tokenIds[1]).to.equal(2n);
      expect(tokenIds[2]).to.equal(3n);
    });

    it("Should return metadata for token", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      const timestamp = BigInt(Date.now());

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property Deed #123",
        "QmTestCID",
        "0xtesthash",
        "0xtestsig",
        "consent_v1",
        timestamp,
      ]);

      const tokenId = 1n;
      const metadata = await landOwnershipNFT.read.getMetadata([tokenId]);

      expect(metadata.documentType).to.equal("land_ownership");
      expect(metadata.documentName).to.equal("Property Deed #123");
      expect(metadata.ipfsCid).to.equal("QmTestCID");
      expect(metadata.ciphertextHash).to.equal("0xtesthash");
      expect(metadata.metadataSignature).to.equal("0xtestsig");
      expect(metadata.consentVersion).to.equal("consent_v1");
      expect(metadata.timestamp).to.equal(timestamp);
    });
  });

  describe("Revocation", function () {
    it("Should revoke a token", async function () {
      const { landOwnershipNFT, owner, addr1 } =
        await deployLandOwnershipNFTFixture();

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property",
        "Qm",
        "0xh",
        "0xs",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = 1n;

      await landOwnershipNFT.write.revokeToken([tokenId, "Fraud detected"]);

      const metadata = await landOwnershipNFT.read.getMetadata([tokenId]);
      expect(metadata.revoked).to.equal(true);
      expect(metadata.revocationReason).to.equal("Fraud detected");
    });

    it("Should only allow owner to revoke", async function () {
      const { landOwnershipNFT, addr1 } = await deployLandOwnershipNFTFixture();

      await landOwnershipNFT.write.mintLandOwnership([
        addr1.account.address,
        "land_ownership",
        "Property",
        "Qm",
        "0xh",
        "0xs",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = 1n;

      await expect(
        landOwnershipNFT.write.revokeToken([tokenId, "Unauthorized"], {
          account: addr1.account,
        })
      ).to.be.rejected;
    });
  });

  describe("Batch Operations", function () {
    it("Should batch mint multiple tokens", async function () {
      const { landOwnershipNFT, addr1, addr2, addr3 } =
        await deployLandOwnershipNFTFixture();

      const recipients = [
        addr1.account.address,
        addr2.account.address,
        addr3.account.address,
      ];

      const timestamp = BigInt(Date.now());

      await landOwnershipNFT.write.batchMintLandOwnership([
        recipients,
        ["land_ownership", "land_ownership", "land_ownership"],
        ["Property 1", "Property 2", "Property 3"],
        ["Qm1", "Qm2", "Qm3"],
        ["0xh1", "0xh2", "0xh3"],
        ["0xs1", "0xs2", "0xs3"],
        ["consent_v1", "consent_v1", "consent_v1"],
        [timestamp, timestamp, timestamp],
      ]);

      expect(
        await landOwnershipNFT.read.balanceOf([addr1.account.address])
      ).to.equal(1n);
      expect(
        await landOwnershipNFT.read.balanceOf([addr2.account.address])
      ).to.equal(1n);
      expect(
        await landOwnershipNFT.read.balanceOf([addr3.account.address])
      ).to.equal(1n);
    });

    it("Should reject batch mint with mismatched arrays", async function () {
      const { landOwnershipNFT, addr1, addr2 } =
        await deployLandOwnershipNFTFixture();

      const recipients = [addr1.account.address, addr2.account.address];
      const timestamp = BigInt(Date.now());

      // Provide only 1 document name instead of 2
      await expect(
        landOwnershipNFT.write.batchMintLandOwnership([
          recipients,
          ["land_ownership", "land_ownership"],
          ["Property 1"], // Mismatch - only 1 instead of 2
          ["Qm1", "Qm2"],
          ["0xh1", "0xh2"],
          ["0xs1", "0xs2"],
          ["consent_v1", "consent_v1"],
          [timestamp, timestamp],
        ])
      ).to.be.rejectedWith("ArrayLengthMismatch");
    });
  });
});
