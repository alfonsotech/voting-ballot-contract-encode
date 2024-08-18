import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { abi } from "../artifacts/contracts/Ballot.sol/Ballot.json";
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = "0x8d819fc976fc30070ef1975aaabdd11f23f0ca49";
const ACCOUNT_TO_GIVE_RIGHTS = "0x0D474076b39aD7bdD7c1C333Cd0645c8e64e8809";

async function giveVotingRights() {
  const providerApiKey = process.env.ALCHEMY_API_KEY || "";
  const deployerPrivateKey = process.env.PRIVATE_KEY || "";

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const hash = await deployer.writeContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "giveRightToVote",
    args: [ACCOUNT_TO_GIVE_RIGHTS],
  });

  console.log("Transaction hash:", hash);
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Transaction confirmed");
}

giveVotingRights().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
