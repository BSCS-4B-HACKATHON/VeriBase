import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NationalIdNFTModule = buildModule("NationalIdNFTModule", (m) => {
  const nationalIdNFT = m.contract("NationalIdNFT", []);

  return { nationalIdNFT };
});

export default NationalIdNFTModule;
