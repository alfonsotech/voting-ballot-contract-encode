import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi } from "../artifacts/contracts/Ballot.sol/Ballot.json";
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = "0xb0f30f11dffa200f93a35d8aada85bd27fde2e58";
const VOTING_ACCOUNT = "0x0D474076b39aD7bdD7c1C333Cd0645c8e64e8809";
const PROPOSAL_INDEX = 0; // The index of the proposal to vote for

async function castVote() {
  const providerApiKey = process.env.ALCHEMY_API_KEY || "";
  const voterPrivateKey = process.env.VOTER_PRIVATE_KEY || "";

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${voterPrivateKey}`);

  const voter = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const hash = await voter.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "vote",
    args: [BigInt(PROPOSAL_INDEX)],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Vote cast successfully");
}

castVote().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
