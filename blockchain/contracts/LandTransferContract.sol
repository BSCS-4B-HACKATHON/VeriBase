// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LandTransferContract
 * @notice Authorized contract for facilitating FREE land ownership NFT transfers
 * @dev This contract enables simple land transfers without payment - just recipient wallet needed
 *      Only this contract can transfer LandOwnershipNFTs between wallets
 */
contract LandTransferContract is Ownable {
    // ============ State Variables ============
    
    /// @notice Reference to the LandOwnershipNFT contract
    address public landOwnershipNFT;
    
    // ============ Structs ============
    
    enum TransferStatus {
        Pending,
        Completed,
        Cancelled
    }
    
    struct TransferRequest {
        uint256 tokenId;
        address seller;
        address buyer;
        TransferStatus status;
        uint256 createdAt;
        string legalDocumentCid; // IPFS CID of transfer agreement
    }
    
    // ============ Mappings ============
    
    /// @notice Transfer ID => Transfer Request
    mapping(uint256 => TransferRequest) public transferRequests;
    
    /// @notice Counter for transfer IDs
    uint256 private _transferIdCounter;
    
    /// @notice TokenId => Active Transfer ID (0 if none)
    mapping(uint256 => uint256) public activeTransfers;
    
    // ============ Events ============
    
    event TransferInitiated(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer
    );
    
    event TransferCompleted(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer
    );
    
    event TransferCancelled(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed initiator
    );
    
    event LandNFTContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );
    
    // ============ Errors ============
    
    error InvalidLandNFTContract();
    error TransferNotFound();
    error TransferAlreadyExists();
    error TransferNotPending();
    error UnauthorizedCaller();
    error TransferFailed();
    
    // ============ Constructor ============
    
    constructor(address _landOwnershipNFT) Ownable(msg.sender) {
        if (_landOwnershipNFT == address(0)) revert InvalidLandNFTContract();
        
        landOwnershipNFT = _landOwnershipNFT;
        _transferIdCounter = 1;
    }
    
    // ============ Owner Functions ============
    
    /**
     * @notice Update the LandOwnershipNFT contract address
     */
    function setLandNFTContract(address _landOwnershipNFT) external onlyOwner {
        if (_landOwnershipNFT == address(0)) revert InvalidLandNFTContract();
        address oldContract = landOwnershipNFT;
        landOwnershipNFT = _landOwnershipNFT;
        emit LandNFTContractUpdated(oldContract, _landOwnershipNFT);
    }
    
    // ============ Transfer Functions ============
    
    /**
     * @notice Initiate a FREE land transfer - only needs recipient wallet
     * @dev Creates a transfer request and locks the token
     */
    function initiateTransfer(
        uint256 tokenId,
        address buyer,
        string calldata legalDocumentCid
    ) external returns (uint256) {
        if (activeTransfers[tokenId] != 0) revert TransferAlreadyExists();
        
        // Verify caller owns the token
        (bool success, bytes memory data) = landOwnershipNFT.call(
            abi.encodeWithSignature("ownerOf(uint256)", tokenId)
        );
        require(success, "Failed to verify ownership");
        address owner = abi.decode(data, (address));
        
        if (owner != msg.sender) revert UnauthorizedCaller();
        
        uint256 transferId = _transferIdCounter++;
        
        transferRequests[transferId] = TransferRequest({
            tokenId: tokenId,
            seller: msg.sender,
            buyer: buyer,
            status: TransferStatus.Pending,
            createdAt: block.timestamp,
            legalDocumentCid: legalDocumentCid
        });
        
        activeTransfers[tokenId] = transferId;
        
        emit TransferInitiated(transferId, tokenId, msg.sender, buyer);
        
        return transferId;
    }
    
    /**
     * @notice Complete the transfer (called by owner/admin after verification)
     * @dev Transfers NFT from seller to buyer - NO PAYMENT INVOLVED
     */
    function completeTransfer(uint256 transferId) external onlyOwner {
        TransferRequest storage transfer = transferRequests[transferId];
        
        if (transfer.seller == address(0)) revert TransferNotFound();
        if (transfer.status != TransferStatus.Pending) revert TransferNotPending();
        
        // Mark as completed
        transfer.status = TransferStatus.Completed;
        activeTransfers[transfer.tokenId] = 0;
        
        // Transfer NFT (no payment involved)
        (bool nftSuccess, ) = landOwnershipNFT.call(
            abi.encodeWithSignature(
                "authorizedTransfer(address,address,uint256)",
                transfer.seller,
                transfer.buyer,
                transfer.tokenId
            )
        );
        if (!nftSuccess) revert TransferFailed();
        
        emit TransferCompleted(
            transferId,
            transfer.tokenId,
            transfer.seller,
            transfer.buyer
        );
    }
    
    /**
     * @notice Cancel a transfer
     */
    function cancelTransfer(uint256 transferId) external {
        TransferRequest storage transfer = transferRequests[transferId];
        
        if (transfer.seller == address(0)) revert TransferNotFound();
        if (transfer.status != TransferStatus.Pending) revert TransferNotPending();
        
        // Only seller, buyer, or owner can cancel
        bool authorized = msg.sender == transfer.seller ||
                         msg.sender == transfer.buyer ||
                         msg.sender == owner();
        
        if (!authorized) revert UnauthorizedCaller();
        
        // Mark as cancelled
        transfer.status = TransferStatus.Cancelled;
        activeTransfers[transfer.tokenId] = 0;
        
        emit TransferCancelled(transferId, transfer.tokenId, msg.sender);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get transfer details
     */
    function getTransferDetails(uint256 transferId)
        external
        view
        returns (TransferRequest memory)
    {
        return transferRequests[transferId];
    }
    
    /**
     * @notice Check if a token has an active transfer
     */
    function hasActiveTransfer(uint256 tokenId) external view returns (bool) {
        return activeTransfers[tokenId] != 0;
    }
}
