import { createPublicClient, http, hexToString } from "viem";
import { sepolia } from "viem/chains";
import { abi } from "../artifacts/contracts/Ballot.sol/Ballot.json";
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

async function queryResults() {
  const providerApiKey = process.env.ALCHEMY_API_KEY || "";

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  const winningProposalIndex = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "winningProposal",
  });

  const winnerName = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "winnerName",
  });

  console.log("Winning Proposal Index:", winningProposalIndex);
  console.log("Winner Name:", hexToString(winnerName as `0x${string}`, { size: 32 }));

}

queryResults().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
