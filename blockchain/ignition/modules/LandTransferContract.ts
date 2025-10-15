import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LandTransferContractModule = buildModule(
  "LandTransferContractModule",
  (m) => {
    // Parameters
    const landOwnershipNFT = m.getParameter("landOwnershipNFT");
    const transferFeeBasisPoints = m.getParameter(
      "transferFeeBasisPoints",
      250
    ); // 2.5% default
    const feeRecipient = m.getParameter("feeRecipient");

    const landTransferContract = m.contract("LandTransferContract", [
      landOwnershipNFT,
      transferFeeBasisPoints,
      feeRecipient,
    ]);

    return { landTransferContract };
  }
);

export default LandTransferContractModule;
