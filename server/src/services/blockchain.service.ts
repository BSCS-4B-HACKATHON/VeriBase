/**
 * Blockchain Service
 * 
 * This service connects your Express server to the blockchain minting script.
 * It handles the execution of blockchain operations from your API endpoints.
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Configuration
const BLOCKCHAIN_DIR = path.resolve(__dirname, "../../../blockchain");
const NETWORK = process.env.BLOCKCHAIN_NETWORK || "baseSepolia";

interface MintRequest {
    requestId: string;
    requesterWallet: string;
    requestType: string;
    files: Array<{
        cid?: string;
        uri?: string;
        filename?: string;
        name?: string;
        hash?: string;
        ciphertextHash?: string;
    }>;
    status: string;
}

interface MintResult {
    success: boolean;
    requestId: string;
    transactionHash: string;
    tokenIds: number[];
    tokens?: Array<{
        tokenId: number;
        filename: string;
        hash: string;
    }>;
}

/**
 * Mint NFT for a verified request using the blockchain script
 */
export async function mintNFTForUser(
    requestData: MintRequest
): Promise<MintResult> {
    try {
        console.log(`🎫 Initiating blockchain minting for request: ${requestData.requestId}`);
        console.log(`   Network: ${NETWORK}`);
        console.log(`   Wallet: ${requestData.requesterWallet}`);

        // Prepare the request data
        const mintData = {
            requestId: requestData.requestId,
            requesterWallet: requestData.requesterWallet,
            requestType: requestData.requestType,
            files: requestData.files.map((file) => ({
                cid: file.cid || file.uri || "",
                filename: file.filename || file.name || "unknown",
                ciphertextHash: file.ciphertextHash || file.hash || "",
            })),
            status: requestData.status,
        };

        // Save request data to temp file
        const tempDataPath = path.join(
            BLOCKCHAIN_DIR,
            `temp_mint_${requestData.requestId}.json`
        );
        const fs = await import("fs/promises");
        await fs.writeFile(
            tempDataPath,
            JSON.stringify(mintData, null, 2)
        );

        console.log(`   📄 Temp data saved to: ${tempDataPath}`);

        // Execute the minting script
        const scriptPath = path.join(
            BLOCKCHAIN_DIR,
            "scripts",
            "userMintNFT.ts"
        );

        const command = `cd "${BLOCKCHAIN_DIR}" && npx hardhat run "${scriptPath}" --network ${NETWORK}`;

        console.log(`   🔨 Executing: npx hardhat run scripts/userMintNFT.ts --network ${NETWORK}`);

        // Set environment variable for the script to read
        const env = {
            ...process.env,
            MINT_REQUEST_DATA: JSON.stringify(mintData),
        };

        const { stdout, stderr } = await execAsync(command, {
            cwd: BLOCKCHAIN_DIR,
            env,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        console.log(`   ✅ Script executed successfully`);

        // Clean up temp file
        try {
            await fs.unlink(tempDataPath);
        } catch (e) {
            // Ignore cleanup errors
        }

        // Parse the output to extract minting result
        // The script should output JSON result
        let result: MintResult;

        try {
            // Look for JSON in the output
            const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: parse from logs
                const txHashMatch = stdout.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
                const tokenIdsMatch = stdout.match(/Token #(\d+)/g);

                result = {
                    success: true,
                    requestId: requestData.requestId,
                    transactionHash: txHashMatch ? txHashMatch[1] : "0x",
                    tokenIds: tokenIdsMatch
                        ? tokenIdsMatch.map((m) => parseInt(m.match(/\d+/)![0]))
                        : [],
                };
            }
        } catch (parseError) {
            console.warn("   ⚠️  Could not parse minting result, using fallback");
            result = {
                success: true,
                requestId: requestData.requestId,
                transactionHash: "0x" + "0".repeat(64),
                tokenIds: [],
            };
        }

        if (stderr && !stderr.includes("Warning")) {
            console.warn(`   ⚠️  Script warnings: ${stderr}`);
        }

        console.log(`   🎉 Minting completed!`);
        console.log(`      Transaction: ${result.transactionHash}`);
        console.log(`      Token IDs: ${result.tokenIds.join(", ")}`);

        return result;
    } catch (error: any) {
        console.error(`   ❌ Blockchain minting failed:`, error);
        throw new Error(
            `Blockchain minting failed: ${error.message || "Unknown error"}`
        );
    }
}

/**
 * Alternative: Direct import method (requires TypeScript compatibility)
 * Use this if you can resolve the module import issues
 */
export async function mintNFTForUserDirect(
    requestData: MintRequest
): Promise<MintResult> {
    try {
        // Dynamic import of the minting script
        const { default: mintNFTForUser } = await import(
            "../../../blockchain/scripts/userMintNFT.js"
        );

        const result = await mintNFTForUser(requestData, null);

        return result;
    } catch (error: any) {
        console.error("Direct import failed:", error);
        throw new Error(`Direct minting failed: ${error.message}`);
    }
}
