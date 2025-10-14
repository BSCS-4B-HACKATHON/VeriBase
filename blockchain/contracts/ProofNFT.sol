// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofNFT
 * @notice ERC-721 NFT that stores keccak256 hashes representing off-chain data proofs
 * @dev Each token is associated with a bytes32 hash. Only the contract owner (server) can mint.
 *      Users can verify their ownership of data by providing plaintext that hashes to the stored value.
 * 
 * Security considerations:
 * - Hashes are public on-chain; privacy depends on preimage secrecy and sufficient entropy
 * - Consider salting data before hashing to prevent rainbow table attacks
 * - Uniqueness guard prevents duplicate hash minting
 * - Owner should be a secure backend wallet with proper key management
 */
contract ProofNFT is ERC721, Ownable {
    // ============ State Variables ============
    
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @notice Maps tokenId => keccak256 hash of the off-chain data
    mapping(uint256 => bytes32) private _tokenHashes;
    
    /// @notice Guards against duplicate hashes being minted
    mapping(bytes32 => bool) private _hashExists;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a new proof token is minted
     * @param to Address receiving the token
     * @param tokenId The newly minted token ID
     * @param hash The keccak256 hash stored for this token
     */
    event ProofMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed hash
    );
    
    // ============ Errors ============
    
    error HashAlreadyExists();
    error InvalidHash();
    error TokenDoesNotExist();
    error ProofVerificationFailed();
    error EmptyBatchArray();
    error ArrayLengthMismatch();
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the ProofNFT contract
     * @dev Sets the contract deployer as the initial owner
     */
    constructor() ERC721("ProofNFT", "PROOF") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs at 1
    }
    
    // ============ Owner Functions ============
    
    /**
     * @notice Mints a single proof token to a specified address
     * @dev Only callable by contract owner (backend server)
     * @param to Address to receive the token
     * @param hash keccak256 hash of the off-chain data
     * @return tokenId The ID of the newly minted token
     */
    function ownerMintTo(address to, bytes32 hash) 
        external 
        onlyOwner 
        returns (uint256 tokenId) 
    {
        if (hash == bytes32(0)) revert InvalidHash();
        if (_hashExists[hash]) revert HashAlreadyExists();
        
        tokenId = _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _tokenHashes[tokenId] = hash;
        _hashExists[hash] = true;
        
        emit ProofMinted(to, tokenId, hash);
    }
    
    /**
     * @notice Batch mints multiple proof tokens to multiple addresses
     * @dev Gas-efficient batch minting for server-side operations
     * @param recipients Array of addresses to receive tokens
     * @param hashes Array of keccak256 hashes corresponding to each recipient
     * @return tokenIds Array of newly minted token IDs
     */
    function ownerBatchMintTo(
        address[] calldata recipients,
        bytes32[] calldata hashes
    ) 
        external 
        onlyOwner 
        returns (uint256[] memory tokenIds) 
    {
        uint256 length = recipients.length;
        if (length == 0) revert EmptyBatchArray();
        if (length != hashes.length) revert ArrayLengthMismatch();
        
        tokenIds = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            bytes32 hash = hashes[i];
            
            if (hash == bytes32(0)) revert InvalidHash();
            if (_hashExists[hash]) revert HashAlreadyExists();
            
            uint256 tokenId = _tokenIdCounter++;
            
            _safeMint(recipients[i], tokenId);
            _tokenHashes[tokenId] = hash;
            _hashExists[hash] = true;
            
            tokenIds[i] = tokenId;
            
            emit ProofMinted(recipients[i], tokenId, hash);
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Retrieves the hash stored for a given token
     * @param tokenId The token ID to query
     * @return The bytes32 hash associated with the token
     */
    function getTokenHash(uint256 tokenId) 
        external 
        view 
        returns (bytes32) 
    {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _tokenHashes[tokenId];
    }
    
    /**
     * @notice Checks if a hash has already been minted
     * @param hash The hash to check
     * @return True if the hash exists, false otherwise
     */
    function hashExists(bytes32 hash) external view returns (bool) {
        return _hashExists[hash];
    }
    
    /**
     * @notice Gets the total number of tokens minted
     * @return The total supply of tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ============ Verification Functions ============
    
    /**
     * @notice Verifies that a claimer owns a token and the plaintext data hashes to the stored value
     * @dev This is the core proof verification function
     * @param claimer Address claiming ownership of the data
     * @param tokenId Token ID representing the proof
     * @param plainData Raw data to verify (will be hashed with keccak256)
     * @return True if verification succeeds, false otherwise
     */
    function verifyProof(
        address claimer,
        uint256 tokenId,
        bytes calldata plainData
    ) 
        external 
        view 
        returns (bool) 
    {
        // Check token exists
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) return false;
        
        // Check claimer owns the token
        if (tokenOwner != claimer) return false;
        
        // Check hash matches
        bytes32 computedHash = keccak256(plainData);
        if (computedHash != _tokenHashes[tokenId]) return false;
        
        return true;
    }
    
    /**
     * @notice Verifies proof and reverts with detailed error if verification fails
     * @dev Useful for contract integrations that need explicit failure reasons
     * @param claimer Address claiming ownership of the data
     * @param tokenId Token ID representing the proof
     * @param plainData Raw data to verify
     */
    function verifyProofStrict(
        address claimer,
        uint256 tokenId,
        bytes calldata plainData
    ) 
        external 
        view 
    {
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) revert TokenDoesNotExist();
        if (tokenOwner != claimer) revert ProofVerificationFailed();
        
        bytes32 computedHash = keccak256(plainData);
        if (computedHash != _tokenHashes[tokenId]) revert ProofVerificationFailed();
    }
    
    /**
     * @notice Verifies a hash against a token's stored hash
     * @dev Useful when you already have the hash computed off-chain
     * @param tokenId Token ID to verify against
     * @param hash Pre-computed hash to verify
     * @return True if the hash matches the token's stored hash
     */
    function verifyHash(uint256 tokenId, bytes32 hash) 
        external 
        view 
        returns (bool) 
    {
        if (_ownerOf(tokenId) == address(0)) return false;
        return _tokenHashes[tokenId] == hash;
    }
}
