import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LandOwnershipNFTModule = buildModule("LandOwnershipNFTModule", (m) => {
  const landOwnershipNFT = m.contract("LandOwnershipNFT", []);

  return { landOwnershipNFT };
});

export default LandOwnershipNFTModule;
