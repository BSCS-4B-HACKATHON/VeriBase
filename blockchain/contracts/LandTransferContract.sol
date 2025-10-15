// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandTransferContract
 * @notice Authorized contract for facilitating land ownership NFT transfers
 * @dev This contract enables regulated land transfers with optional escrow and payment processing
 *      Only this contract can transfer LandOwnershipNFTs between wallets
 */
contract LandTransferContract is Ownable, ReentrancyGuard {
    // ============ State Variables ============
    
    /// @notice Reference to the LandOwnershipNFT contract
    address public landOwnershipNFT;
    
    /// @notice Fee percentage for transfers (in basis points, e.g., 250 = 2.5%)
    uint256 public transferFeeBasisPoints;
    
    /// @notice Fee recipient address
    address payable public feeRecipient;
    
    /// @notice Minimum price for a land transfer (in wei)
    uint256 public minimumPrice;
    
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
        uint256 price;
        uint256 escrowedAmount;
        TransferStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        string legalDocumentCid; // IPFS CID of transfer agreement
    }
    
    // ============ Mappings ============
    
    /// @notice Transfer ID => Transfer Request
    mapping(uint256 => TransferRequest) public transferRequests;
    
    /// @notice Counter for transfer IDs
    uint256 private _transferIdCounter;
    
    /// @notice TokenId => Active Transfer ID (0 if none)
    mapping(uint256 => uint256) public activeTransfers;
    
    /// @notice Buyer => Escrowed funds
    mapping(address => uint256) public escrowedFunds;
    
    // ============ Events ============
    
    event TransferInitiated(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    event FundsEscrowed(
        uint256 indexed transferId,
        address indexed buyer,
        uint256 amount
    );
    
    event TransferCompleted(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price,
        uint256 fee
    );
    
    event TransferCancelled(
        uint256 indexed transferId,
        uint256 indexed tokenId,
        address indexed initiator
    );
    
    event FeesUpdated(
        uint256 newFeeBasisPoints,
        address newFeeRecipient
    );
    
    event LandNFTContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );
    
    // ============ Errors ============
    
    error InvalidLandNFTContract();
    error TransferNotFound();
    error TransferAlreadyExists();
    error TransferExpired();
    error TransferNotPending();
    error UnauthorizedCaller();
    error InsufficientEscrow();
    error InsufficientPayment();
    error PriceBelowMinimum();
    error InvalidPrice();
    error TransferFailed();
    error WithdrawalFailed();
    
    // ============ Constructor ============
    
    constructor(
        address _landOwnershipNFT,
        uint256 _transferFeeBasisPoints,
        address payable _feeRecipient
    ) Ownable(msg.sender) {
        if (_landOwnershipNFT == address(0)) revert InvalidLandNFTContract();
        
        landOwnershipNFT = _landOwnershipNFT;
        transferFeeBasisPoints = _transferFeeBasisPoints;
        feeRecipient = _feeRecipient;
        minimumPrice = 0; // Can be updated by owner
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
    
    /**
     * @notice Update transfer fee and fee recipient
     */
    function updateFees(
        uint256 _newFeeBasisPoints,
        address payable _newFeeRecipient
    ) external onlyOwner {
        require(_newFeeBasisPoints <= 1000, "Fee cannot exceed 10%");
        transferFeeBasisPoints = _newFeeBasisPoints;
        feeRecipient = _newFeeRecipient;
        emit FeesUpdated(_newFeeBasisPoints, _newFeeRecipient);
    }
    
    /**
     * @notice Update minimum price for transfers
     */
    function setMinimumPrice(uint256 _minimumPrice) external onlyOwner {
        minimumPrice = _minimumPrice;
    }
    
    // ============ Transfer Functions ============
    
    /**
     * @notice Initiate a land transfer
     * @dev Creates a transfer request and locks the token
     */
    function initiateTransfer(
        uint256 tokenId,
        address buyer,
        uint256 price,
        uint256 durationDays,
        string calldata legalDocumentCid
    ) external nonReentrant returns (uint256) {
        if (price < minimumPrice) revert PriceBelowMinimum();
        if (price == 0) revert InvalidPrice();
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
            price: price,
            escrowedAmount: 0,
            status: TransferStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (durationDays * 1 days),
            legalDocumentCid: legalDocumentCid
        });
        
        activeTransfers[tokenId] = transferId;
        
        emit TransferInitiated(transferId, tokenId, msg.sender, buyer, price);
        
        return transferId;
    }
    
    /**
     * @notice Buyer deposits funds into escrow
     */
    function depositEscrow(uint256 transferId) external payable nonReentrant {
        TransferRequest storage transfer = transferRequests[transferId];
        
        if (transfer.seller == address(0)) revert TransferNotFound();
        if (transfer.status != TransferStatus.Pending) revert TransferNotPending();
        if (block.timestamp > transfer.expiresAt) revert TransferExpired();
        if (msg.sender != transfer.buyer) revert UnauthorizedCaller();
        
        transfer.escrowedAmount += msg.value;
        escrowedFunds[msg.sender] += msg.value;
        
        emit FundsEscrowed(transferId, msg.sender, msg.value);
    }
    
    /**
     * @notice Complete the transfer (called by owner/admin after legal verification)
     */
    function completeTransfer(uint256 transferId) external onlyOwner nonReentrant {
        TransferRequest storage transfer = transferRequests[transferId];
        
        if (transfer.seller == address(0)) revert TransferNotFound();
        if (transfer.status != TransferStatus.Pending) revert TransferNotPending();
        if (transfer.escrowedAmount < transfer.price) revert InsufficientEscrow();
        
        // Calculate fee
        uint256 fee = (transfer.price * transferFeeBasisPoints) / 10000;
        uint256 sellerAmount = transfer.price - fee;
        
        // Mark as completed
        transfer.status = TransferStatus.Completed;
        activeTransfers[transfer.tokenId] = 0;
        escrowedFunds[transfer.buyer] -= transfer.escrowedAmount;
        
        // Transfer NFT
        (bool nftSuccess, ) = landOwnershipNFT.call(
            abi.encodeWithSignature(
                "authorizedTransfer(address,address,uint256)",
                transfer.seller,
                transfer.buyer,
                transfer.tokenId
            )
        );
        if (!nftSuccess) revert TransferFailed();
        
        // Transfer funds to seller
        (bool sellerSuccess, ) = payable(transfer.seller).call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();
        
        // Transfer fee
        if (fee > 0 && feeRecipient != address(0)) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }
        
        // Refund excess escrow if any
        if (transfer.escrowedAmount > transfer.price) {
            uint256 refund = transfer.escrowedAmount - transfer.price;
            (bool refundSuccess, ) = payable(transfer.buyer).call{value: refund}("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit TransferCompleted(
            transferId,
            transfer.tokenId,
            transfer.seller,
            transfer.buyer,
            transfer.price,
            fee
        );
    }
    
    /**
     * @notice Cancel a transfer and refund escrowed funds
     */
    function cancelTransfer(uint256 transferId) external nonReentrant {
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
        
        // Refund escrowed funds
        if (transfer.escrowedAmount > 0) {
            uint256 refund = transfer.escrowedAmount;
            transfer.escrowedAmount = 0;
            escrowedFunds[transfer.buyer] -= refund;
            
            (bool success, ) = payable(transfer.buyer).call{value: refund}("");
            if (!success) revert WithdrawalFailed();
        }
        
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
    
    /**
     * @notice Calculate fee for a given price
     */
    function calculateFee(uint256 price) external view returns (uint256) {
        return (price * transferFeeBasisPoints) / 10000;
    }
    
    /**
     * @notice Get escrowed balance for an address
     */
    function getEscrowedBalance(address account) external view returns (uint256) {
        return escrowedFunds[account];
    }
    
    // ============ Emergency Functions ============
    
    /**
     * @notice Emergency withdrawal (owner only, for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
    }
}
