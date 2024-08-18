import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi } from "../artifacts/contracts/Ballot.sol/Ballot.json";
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = "0x1ba1dd6573b07f53aeca4b11dce2cb46ac14a370";
const DELEGATE_TO_ADDRESS = "0x0D474076b39aD7bdD7c1C333Cd0645c8e64e8809";
async function delegateVote() {
    const providerApiKey = process.env.ALCHEMY_API_KEY || "";
    const delegatorPrivateKey = process.env.PRIVATE_KEY || "";

    // Set up the public client and wallet client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${delegatorPrivateKey}`);
  const delegator = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
    // Connect to the deployed contract
     const hash = await delegator.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "delegate",
    args: [DELEGATE_TO_ADDRESS],
  });
    // Execute the delegate function
    // Wait for and log the transaction receipt
    console.log("Transaction hash:", hash);
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Delegation was successfully");
}

delegateVote().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});