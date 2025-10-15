import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("NationalIdNFT", function () {
  async function deployNationalIdNFTFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();
    const nationalIdNFT = await hre.viem.deployContract("NationalIdNFT");
    const publicClient = await hre.viem.getPublicClient();

    return { nationalIdNFT, owner, addr1, addr2, publicClient };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { nationalIdNFT } = await deployNationalIdNFTFixture();

      expect(await nationalIdNFT.read.name()).to.equal("National ID Proof");
      expect(await nationalIdNFT.read.symbol()).to.equal("NATID");
    });

    it("Should set the deployer as owner", async function () {
      const { nationalIdNFT, owner } = await deployNationalIdNFTFixture();

      expect(await nationalIdNFT.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });
  });

  describe("Minting", function () {
    it("Should mint a National ID NFT successfully", async function () {
      const { nationalIdNFT, owner, addr1 } =
        await deployNationalIdNFTFixture();

      await nationalIdNFT.write.mintNationalId([
        addr1.account.address,
        "national_id",
        "John Doe ID",
        "QmTest123",
        "0xhash123",
        "0xsignature123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      expect(
        await nationalIdNFT.read.balanceOf([addr1.account.address])
      ).to.equal(1n);
      expect(
        await nationalIdNFT.read.hasNationalId([addr1.account.address])
      ).to.equal(true);
    });

    it("Should prevent minting multiple National IDs to same wallet", async function () {
      const { nationalIdNFT, addr1 } = await deployNationalIdNFTFixture();

      await nationalIdNFT.write.mintNationalId([
        addr1.account.address,
        "national_id",
        "John Doe ID",
        "QmTest123",
        "0xhash123",
        "0xsignature123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      await expect(
        nationalIdNFT.write.mintNationalId([
          addr1.account.address,
          "national_id",
          "John Doe ID 2",
          "QmTest456",
          "0xhash456",
          "0xsignature456",
          "consent_v1",
          BigInt(Date.now()),
        ])
      ).to.be.rejectedWith("WalletAlreadyHasNationalId");
    });

    it("Should add files to token", async function () {
      const { nationalIdNFT, addr1 } = await deployNationalIdNFTFixture();

      const tx = await nationalIdNFT.write.mintNationalId([
        addr1.account.address,
        "national_id",
        "John Doe ID",
        "QmTest123",
        "0xhash123",
        "0xsignature123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = await nationalIdNFT.read.getTokenIdByWallet([
        addr1.account.address,
      ]);

      await nationalIdNFT.write.addFileToToken([
        tokenId,
        "QmFile123",
        "id_card.jpg",
        "image/jpeg",
        1024n,
        "iv123",
        "hash123",
        "tag123",
      ]);

      const metadata = await nationalIdNFT.read.getMetadata([tokenId]);
      expect(metadata.files.length).to.equal(1);
      expect(metadata.files[0].filename).to.equal("id_card.jpg");
    });
  });

  describe("Transfer Prevention", function () {
    it("Should prevent transfers", async function () {
      const { nationalIdNFT, addr1, addr2 } =
        await deployNationalIdNFTFixture();

      await nationalIdNFT.write.mintNationalId([
        addr1.account.address,
        "national_id",
        "John Doe ID",
        "QmTest123",
        "0xhash123",
        "0xsignature123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = await nationalIdNFT.read.getTokenIdByWallet([
        addr1.account.address,
      ]);

      // Try to transfer using addr1's client
      await expect(
        nationalIdNFT.write.transferFrom(
          [addr1.account.address, addr2.account.address, tokenId],
          { account: addr1.account }
        )
      ).to.be.rejectedWith("TransferNotAllowed");
    });

    it("Should prevent approvals", async function () {
      const { nationalIdNFT, addr1, addr2 } =
        await deployNationalIdNFTFixture();

      await nationalIdNFT.write.mintNationalId([
        addr1.account.address,
        "national_id",
        "John Doe ID",
        "QmTest123",
        "0xhash123",
        "0xsignature123",
        "consent_v1",
        BigInt(Date.now()),
      ]);

      const tokenId = await nationalIdNFT.read.getTokenIdByWallet([
        addr1.account.address,
      ]);

      await expect(
        nationalIdNFT.write.approve([addr2.account.address, tokenId], {
          account: addr1.account,
        })
      ).to.be.rejectedWith("TransferNotAllowed");
    });
  });
});
