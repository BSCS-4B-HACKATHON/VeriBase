// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NationalIdNFT
 * @notice Non-transferable NFT representing a National ID
 * @dev Each wallet can only hold ONE National ID NFT. Tokens are soul-bound (non-transferable).
 *      Metadata is stored on-chain and matches the database schema structure.
 *      Metadata is 100% unique - duplicate metadataHash rejected.
 */
contract NationalIdNFT is ERC721, Ownable {
    // ============ Structs ============
    
    struct DocMeta {
        string cid;
        string filename;
        string mime;
        uint256 size;
        string iv;
        string ciphertextHash;
        string tag;
    }
    
    struct NationalIdMetadata {
        string requestType;
        string minimalPublicLabel;
        string metadataCid;
        string metadataHash;
        string uploaderSignature;
        DocMeta[] files;
        string consentTextVersion;
        uint256 consentTimestamp;
    }
    
    // ============ State Variables ============
    
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @notice Maps tokenId => metadata
    mapping(uint256 => NationalIdMetadata) private _tokenMetadata;
    
    /// @notice Maps wallet address => tokenId (0 means no token)
    mapping(address => uint256) private _walletToTokenId;
    
    /// @notice Maps tokenId => wallet address
    mapping(uint256 => address) private _tokenIdToWallet;
    
    /// @notice Maps metadataHash => exists (for uniqueness check)
    mapping(string => bool) private _metadataHashExists;
    
    // ============ Events ============
    
    event NationalIdMinted(
        address indexed to,
        uint256 indexed tokenId,
        string metadataCid
    );
    
    // ============ Errors ============
    
    error WalletAlreadyHasNationalId();
    error TransferNotAllowed();
    error TokenDoesNotExist();
    error InvalidAddress();
    error DuplicateMetadata();
    
    // ============ Constructor ============
    
    constructor() ERC721("National ID Proof", "NATID") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }
    
    // ============ Owner Functions ============
    
    /**
     * @notice Mints a National ID NFT to caller's wallet
     * @dev Only one National ID per wallet allowed. Metadata must be unique.
     * @dev Public function - users mint for themselves
     */
    function mintNationalId(
        string calldata requestType,
        string calldata minimalPublicLabel,
        string calldata metadataCid,
        string calldata metadataHash,
        string calldata uploaderSignature,
        string calldata consentTextVersion,
        uint256 consentTimestamp
    ) external returns (uint256) {
        address to = msg.sender; // User mints to themselves
        
        if (to == address(0)) revert InvalidAddress();
        if (_walletToTokenId[to] != 0) revert WalletAlreadyHasNationalId();
        if (_metadataHashExists[metadataHash]) revert DuplicateMetadata();
        
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        _tokenMetadata[tokenId].requestType = requestType;
        _tokenMetadata[tokenId].minimalPublicLabel = minimalPublicLabel;
        _tokenMetadata[tokenId].metadataCid = metadataCid;
        _tokenMetadata[tokenId].metadataHash = metadataHash;
        _tokenMetadata[tokenId].uploaderSignature = uploaderSignature;
        _tokenMetadata[tokenId].consentTextVersion = consentTextVersion;
        _tokenMetadata[tokenId].consentTimestamp = consentTimestamp;
        
        _walletToTokenId[to] = tokenId;
        _tokenIdToWallet[tokenId] = to;
        _metadataHashExists[metadataHash] = true;
        
        emit NationalIdMinted(to, tokenId, metadataCid);
        
        return tokenId;
    }
    
    /**
     * @notice Adds file metadata to an existing token
     * @dev Called separately to avoid stack too deep errors
     */
    function addFileToToken(
        uint256 tokenId,
        string calldata cid,
        string calldata filename,
        string calldata mime,
        uint256 size,
        string calldata iv,
        string calldata ciphertextHash,
        string calldata tag
    ) external onlyOwner {
        if (_tokenIdToWallet[tokenId] == address(0)) revert TokenDoesNotExist();
        
        DocMeta memory file = DocMeta({
            cid: cid,
            filename: filename,
            mime: mime,
            size: size,
            iv: iv,
            ciphertextHash: ciphertextHash,
            tag: tag
        });
        
        _tokenMetadata[tokenId].files.push(file);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets the National ID token owned by a wallet
     * @return tokenId (0 if no token)
     */
    function getTokenIdByWallet(address wallet) external view returns (uint256) {
        return _walletToTokenId[wallet];
    }
    
    /**
     * @notice Checks if a wallet has a National ID
     */
    function hasNationalId(address wallet) external view returns (bool) {
        return _walletToTokenId[wallet] != 0;
    }
    
    /**
     * @notice Checks if metadata hash already exists
     */
    function isMetadataUnique(string calldata metadataHash) external view returns (bool) {
        return !_metadataHashExists[metadataHash];
    }
    
    /**
     * @notice Gets metadata for a token
     */
    function getMetadata(uint256 tokenId) external view returns (NationalIdMetadata memory) {
        if (_tokenIdToWallet[tokenId] == address(0)) revert TokenDoesNotExist();
        return _tokenMetadata[tokenId];
    }
    
    /**
     * @notice Gets total number of National IDs issued
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ============ Transfer Prevention ============
    
    /**
     * @dev Override transfer functions to make tokens non-transferable (soul-bound)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Disable approve functionality
     */
    function approve(address, uint256) public virtual override {
        revert TransferNotAllowed();
    }
    
    /**
     * @dev Disable setApprovalForAll functionality
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert TransferNotAllowed();
    }
}
