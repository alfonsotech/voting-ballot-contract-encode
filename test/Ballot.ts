import { expect } from "chai";
import { toHex, hexToString } from "viem";
import { viem } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function deployContract() {
  const publicClient = await viem.getPublicClient();
  const [deployer, otherAccount] = await viem.getWalletClients();
  const ballotContract = await viem.deployContract("Ballot", [
    PROPOSALS.map((prop) => toHex(prop, { size: 32 })),
  ]);
  
  return { publicClient, deployer, otherAccount, ballotContract };
}

describe("Ballot", () => {
  describe("when the contract is deployed", async () => {

    it("has the provided proposals", async () => {
        const { ballotContract } = await loadFixture(deployContract);
        for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.read.proposals([BigInt(index)]);
        expect(hexToString(proposal[0], { size: 32 })).to.eq(PROPOSALS[index]);
        }
    });

    it("has zero votes for all proposals", async () => {
      const { ballotContract } = await loadFixture(deployContract);
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.read.proposals([BigInt(index)]);
        expect(proposal[1]).to.eq(0n);
      }
    });

    it("sets the deployer address as chairperson", async () => {
        const { ballotContract, deployer } = await loadFixture(deployContract);
        const chairperson = await ballotContract.read.chairperson();
        expect(chairperson.toLowerCase()).to.eq(deployer.account.address);
    });

    it("sets the voting weight for the chairperson as 1", async () => {
      const { ballotContract } = await loadFixture(deployContract);
      const chairperson = await ballotContract.read.chairperson();
      const chairpersonVoter = await ballotContract.read.voters([chairperson])
      expect(chairpersonVoter[0]).to.equal(1n)
    });
    
  });
   });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", () => {
  it("gives right to vote for another address", async () => {
    const { ballotContract, deployer, otherAccount } = await loadFixture(deployContract);
    
    // Check initial voting weight of otherAccount
    const initialVoter = await ballotContract.read.voters([otherAccount.account.address]);
    expect(initialVoter[0]).to.equal(0n);

    // Give right to vote
    await ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account });

    // Check updated voting weight of otherAccount
    const updatedVoter = await ballotContract.read.voters([otherAccount.account.address]);
    expect(updatedVoter[0]).to.equal(1n);
  });
    it("can not give right to vote for someone that has voted", async () => {
      const { ballotContract, deployer, otherAccount } = await loadFixture(deployContract);
       // Give right to vote to otherAccount
      await ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account });

      // Cast a vote from otherAccount
      await ballotContract.write.vote([0n], { account: otherAccount.account });

      await expect(
      ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account })
      ).to.be.rejectedWith("The voter already voted.");

    });


it("can not give right to vote for someone that has already voting rights", async () => {
  const { ballotContract, deployer, otherAccount } = await loadFixture(deployContract);

  // Give right to vote to otherAccount
  await ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account });

  // Try to give right to vote again to the same account
  await expect(
    ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account })
  ).to.be.rejectedWith("The voter already has voting rights.");
});


describe("when the voter interacts with the vote function in the contract", () => {
  it("should register the vote", async () => {
    const { ballotContract, deployer, otherAccount } = await loadFixture(deployContract);
    
    // Give right to vote to otherAccount
    await ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account });
    
    // Cast a vote
    const proposalIndex = 1n;
    await ballotContract.write.vote([proposalIndex], { account: otherAccount.account });
    
    // Check if the vote was registered
    const proposal = await ballotContract.read.proposals([proposalIndex]);
    
    expect(proposal[1]).to.equal(1n);
    
    // Check if the voter's 'voted' status is updated
    const voter = await ballotContract.read.voters([otherAccount.account.address]);
    // console.log('voter', voter);
    
    expect(voter[1]).to.be.true;
    expect(voter[3]).to.equal(proposalIndex);
   
  });
});


describe("when the voter interacts with the delegate function in the contract", () => {
  it("should transfer voting power", async () => {
    const { ballotContract, deployer, otherAccount } = await loadFixture(deployContract);
    // const [, delegateAccount] = await viem.getWalletClients();
// console.log('delegateAccount>>>>>>>>>>>>>>>>>>>>>>>>>>', delegateAccount);
// console.log('otherAccount>>>>>>>>>>>>>>>>>>>>>>>>>>', otherAccount);

    // Give right to vote to otherAccount, delegateAccount
    await ballotContract.write.giveRightToVote([otherAccount.account.address], { account: deployer.account });
    // await ballotContract.write.giveRightToVote([delegateAccount.account.address], { account: deployer.account });



    // Check initial weights
    // const initialOtherAccountVoter = await ballotContract.read.voters([otherAccount.account.address]);
    // const initialDelegateVoter = await ballotContract.read.voters([delegateAccount.account.address]);
    // expect(initialOtherAccountVoter[0]).to.equal(1n);
    // expect(initialDelegateVoter[0]).to.equal(1n);

    // Delegate vote from otherAccount to delegateAccount
    await ballotContract.write.delegate([otherAccount.account.address], { account: deployer.account });

    // Check if voting power was transferred
    const finalOtherAccountVoter = await ballotContract.read.voters([otherAccount.account.address]);
    // const finalDelegateVoter = await ballotContract.read.voters([delegateAccount.account.address]);

    expect(finalOtherAccountVoter[0]).to.equal(2n);
    // expect(finalDelegateVoter[0]).to.equal(2n);
    expect(finalOtherAccountVoter[1]).to.be.false; // voted flag should be true
    // expect(finalOtherAccountVoter[2]).to.equal(delegateAccount.account.address); // delegate should be set
  });
});



describe("when an account other than the chairperson interacts with the giveRightToVote function in the contract", () => {
  it("should revert", async () => {
    const { ballotContract, otherAccount } = await loadFixture(deployContract);
    const [,, someoneElse] = await viem.getWalletClients();

    await expect(
      ballotContract.write.giveRightToVote([someoneElse.account.address], { account: otherAccount.account })
    ).to.be.rejectedWith("Only chairperson can give right to vote.");
  });
});



 describe("when an account without right to vote interacts with the vote function in the contract", () => {
  it("should revert", async () => {
    const { ballotContract, otherAccount } = await loadFixture(deployContract);
    await expect(
      ballotContract.write.vote([0n], { account: otherAccount.account })
    ).to.be.rejectedWith("Has no right to vote");
  });
});

describe("when an account without right to vote interacts with the delegate function in the contract", () => {
  it("should revert", async () => {
    const { ballotContract, otherAccount } = await loadFixture(deployContract);
    const [,, someoneElse] = await viem.getWalletClients();
    await expect(
      ballotContract.write.delegate([someoneElse.account.address], { account: otherAccount.account })
    ).to.be.rejectedWith("You have no right to vote");
  });
});

describe("when someone interacts with the winningProposal function before any votes are cast", () => {
  it("should return 0", async () => {
    const { ballotContract } = await loadFixture(deployContract);
    const winningProposal = await ballotContract.read.winningProposal();
    expect(winningProposal).to.equal(0n);
  });
});

describe("when someone interacts with the winningProposal function after one vote is cast for the first proposal", () => {
  it("should return 0", async () => {
    const { ballotContract, deployer } = await loadFixture(deployContract);
    await ballotContract.write.vote([0n], { account: deployer.account });
    const winningProposal = await ballotContract.read.winningProposal();
    expect(winningProposal).to.equal(0n);
  });
});

describe("when someone interacts with the winnerName function before any votes are cast", () => {
  it("should return name of proposal 0", async () => {
    const { ballotContract } = await loadFixture(deployContract);
    const winnerName = await ballotContract.read.winnerName();
    expect(hexToString(winnerName, { size: 32 })).to.equal(PROPOSALS[0]);
  });
});

describe("when someone interacts with the winnerName function after one vote is cast for the first proposal", () => {
  it("should return name of proposal 0", async () => {
    const { ballotContract, deployer } = await loadFixture(deployContract);
    await ballotContract.write.vote([0n], { account: deployer.account });
    const winnerName = await ballotContract.read.winnerName();
    expect(hexToString(winnerName, { size: 32 })).to.equal(PROPOSALS[0]);
  });
});

describe("when someone interacts with the winningProposal function and winnerName after 5 random votes are cast for the proposals", () => {
  it("should return the name of the winner proposal", async () => {
    const { ballotContract, deployer } = await loadFixture(deployContract);
    const voters = await viem.getWalletClients();
    
    // Give right to vote to 5 accounts
    for (let i = 1; i < 6; i++) {
      await ballotContract.write.giveRightToVote([voters[i].account.address], { account: deployer.account });
    }
    
    // Cast 5 random votes
    const voteCounts = [0, 0, 0];
    for (let i = 1; i < 6; i++) {
      const randomProposal = Math.floor(Math.random() * 3);
      await ballotContract.write.vote([BigInt(randomProposal)], { account: voters[i].account });
      voteCounts[randomProposal]++;
    }
    
    const winningProposal = await ballotContract.read.winningProposal();
    const winnerName = await ballotContract.read.winnerName();
    
    const expectedWinner = voteCounts.indexOf(Math.max(...voteCounts));
    expect(winningProposal).to.equal(BigInt(expectedWinner));
    expect(hexToString(winnerName, { size: 32 })).to.equal(PROPOSALS[expectedWinner]);
  });
});
  });