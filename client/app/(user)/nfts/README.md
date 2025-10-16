# NFT Documents Page - VeriBase Dashboard

## Overview

The **NFT Documents** page displays all blockchain-verified ownership documents (Land Titles and National IDs) that users own as NFTs. This page provides a modern, elegant interface for viewing and managing verified documents with full blockchain transparency.

## Features

### ✨ Core Functionality

1. **NFT Display Grid**

   - Responsive grid layout (1-4 columns based on screen size)
   - Beautiful card design with hover effects and green accent glow
   - Loading skeletons with staggered animations
   - Empty state with call-to-action

2. **NFT Card Information**

   - Thumbnail/preview image
   - Verified badge overlay
   - Document title and type
   - Token ID (monospace)
   - Minted date
   - Quick action buttons

3. **Interactive Actions**

   - **View Details** - Opens detailed modal
   - **Copy Token ID** - Copies to clipboard with toast notification
   - **View on Explorer** - Opens blockchain explorer (Etherscan)
   - **Refresh** - Re-fetches NFT data from blockchain

4. **Details Modal (Sheet)**
   - Full NFT image preview
   - Verification status indicator
   - Complete metadata display:
     - Document type
     - Token ID (copyable)
     - Contract address (copyable)
     - Owner address
     - Minted date & time
   - Direct link to blockchain explorer

### 🎨 Design System

#### Color Palette

- **Primary Green**: `#3ECF8E` (Light mode: `#72e3ad`)
- **Background**: Dark mode optimized (`#121212`, `#171717`)
- **Surface colors**: `surface-75`, `surface-200`, `surface-300`
- **Accent colors**: Blue for Land Titles, Purple for National IDs

#### Visual Effects

- Smooth fade-in animations on page load
- Hover glow effects with green tint
- Card scale transforms on hover
- Gradient background decorations
- Skeleton loading animations
- Ping animation on empty state icon

#### Typography

- **Headers**: Bold, 3xl-4xl sizing
- **Body**: Geist Sans font family
- **Code**: Geist Mono for addresses/token IDs

### 📱 Responsive Design

- **Mobile (< 640px)**: Single column grid
- **Tablet (640px - 1024px)**: 2 column grid
- **Desktop (1024px - 1280px)**: 3 column grid
- **Large Desktop (> 1280px)**: 4 column grid

### 🔐 Blockchain Integration

The page is designed to integrate with:

- Web3 wallet connection (via `useWallet` hook)
- NFT contract interactions
- Blockchain explorer links (Etherscan)
- Metadata fetching from IPFS/blockchain

## File Structure

```
client/app/(user)/nfts/
├── page.tsx              # Main NFT Documents page
└── README.md             # This file
```

## Components Used

- `Card`, `CardContent` - UI card components
- `Button` - Action buttons with variants
- `Badge` - Status and type indicators
- `Sheet` - Modal/drawer for NFT details
- `motion` (Framer Motion) - Animations
- Icons from `lucide-react`

## Data Structure

```typescript
interface NFTDocument {
  id: string;
  tokenId: string;
  title: string;
  type: "Land Title" | "National ID";
  mintedDate: string;
  contractAddress: string;
  ownerAddress: string;
  imageUrl?: string;
  metadataUrl?: string;
  verified: boolean;
  blockchainExplorerUrl: string;
}
```

## Future Enhancements

- [ ] Connect to real blockchain NFT contract
- [ ] Implement IPFS metadata fetching
- [ ] Add filtering by document type
- [ ] Add search functionality
- [ ] Implement transfer/send NFT feature
- [ ] Add download as PDF option
- [ ] Show transaction history
- [ ] Add share functionality

## Integration Points

### Current Mock Data

The page currently uses mock NFT data. Replace the `fetchNFTs` function with actual blockchain calls:

```typescript
// TODO: Replace with actual implementation
const fetchNFTs = async () => {
  // Call smart contract to get user's NFTs
  // Fetch metadata from IPFS
  // Format data into NFTDocument interface
};
```

### Recommended Libraries

- **ethers.js** or **viem** - Blockchain interactions
- **wagmi** - React hooks for Ethereum
- **IPFS** - Metadata storage/retrieval

## Sidebar Navigation

The page is accessible via:

- **Route**: `/nfts`
- **Sidebar Item**: "NFT Documents" (between "Requests" and bottom of nav)
- **Icon**: File icon from Tabler Icons

## User Experience

### Empty State

When no NFTs exist:

- Centered empty state card
- Animated ping icon (green accent)
- Clear message explaining the state
- "Go to Requests" CTA button

### Loading State

- 4 skeleton cards with pulse animation
- Staggered entrance animations
- Maintains layout structure

### Loaded State

- NFT cards in responsive grid
- Smooth entrance animations
- Interactive hover states
- Full functionality available

## Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios

## Performance

- Lazy loading of images
- Optimized animations with Framer Motion
- Efficient re-renders with React hooks
- Toast notifications for user feedback

---

**Built with ❤️ for VeriBase Dashboard**
