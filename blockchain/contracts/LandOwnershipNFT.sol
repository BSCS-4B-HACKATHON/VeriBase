// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LandOwnershipNFT
 * @notice Transferable NFT representing Land Ownership
 * @dev Multiple land ownership NFTs per wallet allowed.
 *      Transfers ONLY through authorized contract (LandTransferContract).
 *      Metadata is 100% unique - duplicate metadataHash rejected.
 */
contract LandOwnershipNFT is ERC721, Ownable {
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
    
    struct LandOwnershipMetadata {
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
    mapping(uint256 => LandOwnershipMetadata) private _tokenMetadata;
    
    /// @notice Maps tokenId => wallet address
    mapping(uint256 => address) private _tokenIdToWallet;
    
    /// @notice Authorized transfer contract that can facilitate transfers
    address public transferContract;
    
    /// @notice Maps metadataHash => exists (for uniqueness check)
    mapping(string => bool) private _metadataHashExists;
    
    // ============ Events ============
    
    event LandOwnershipMinted(
        address indexed to,
        uint256 indexed tokenId,
        string metadataCid
    );
    
    event TransferContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );
    
    event AuthorizedTransfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    
    // ============ Errors ============
    
    error UnauthorizedTransfer();
    error TokenDoesNotExist();
    error InvalidAddress();
    error DuplicateMetadata();
    
    // ============ Constructor ============
    
    constructor() ERC721("Land Ownership Proof", "LAND") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }
    
    // ============ Owner Functions ============
    
    /**
     * @notice Mints a Land Ownership NFT to a wallet
     * @dev Multiple land ownership NFTs per wallet allowed. Metadata must be unique.
     */
    function mintLandOwnership(
        address to,
        string calldata requestType,
        string calldata minimalPublicLabel,
        string calldata metadataCid,
        string calldata metadataHash,
        string calldata uploaderSignature,
        string calldata consentTextVersion,
        uint256 consentTimestamp
    ) external onlyOwner returns (uint256) {
        if (to == address(0)) revert InvalidAddress();
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
        
        _tokenIdToWallet[tokenId] = to;
        _metadataHashExists[metadataHash] = true;
        
        emit LandOwnershipMinted(to, tokenId, metadataCid);
        
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
    
    /**
     * @notice Sets the authorized transfer contract
     * @dev Only this contract can facilitate transfers between wallets
     */
    function setTransferContract(address _transferContract) external onlyOwner {
        address oldContract = transferContract;
        transferContract = _transferContract;
        emit TransferContractUpdated(oldContract, _transferContract);
    }
    
    // ============ Transfer Contract Functions ============
    
    /**
     * @notice Allows the authorized transfer contract to transfer land ownership
     * @dev This enables regulated land sales/transfers through a trusted contract
     */
    function authorizedTransfer(
        address from,
        address to,
        uint256 tokenId
    ) external {
        if (msg.sender != transferContract) revert UnauthorizedTransfer();
        if (to == address(0)) revert InvalidAddress();
        
        _transfer(from, to, tokenId);
        _tokenIdToWallet[tokenId] = to;
        
        emit AuthorizedTransfer(from, to, tokenId);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets all token IDs owned by a wallet
     */
    function getTokensByWallet(address wallet) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(wallet);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 index = 0;
        
        for (uint256 tokenId = 1; tokenId < _tokenIdCounter; tokenId++) {
            if (_ownerOf(tokenId) == wallet) {
                tokenIds[index] = tokenId;
                index++;
                if (index == balance) break;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @notice Gets metadata for a token
     */
    function getMetadata(uint256 tokenId) external view returns (LandOwnershipMetadata memory) {
        if (_tokenIdToWallet[tokenId] == address(0)) revert TokenDoesNotExist();
        return _tokenMetadata[tokenId];
    }
    
    /**
     * @notice Checks if metadata hash already exists
     */
    function isMetadataUnique(string calldata metadataHash) external view returns (bool) {
        return !_metadataHashExists[metadataHash];
    }
    
    /**
     * @notice Gets total number of land ownership NFTs issued
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ============ Transfer Control ============
    
    /**
     * @dev Override transfer functions to prevent direct wallet-to-wallet transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Allow transfers from transfer contract (checked in authorizedTransfer)
        // Block all other transfers
        if (from != address(0) && to != address(0) && msg.sender != transferContract) {
            revert UnauthorizedTransfer();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Disable standard approve - transfers must go through transfer contract
     */
    function approve(address, uint256) public virtual override {
        revert UnauthorizedTransfer();
    }
    
    /**
     * @dev Disable setApprovalForAll - transfers must go through transfer contract
     */
    function setApprovalForAll(address, bool) public virtual override {
        revert UnauthorizedTransfer();
    }
}
