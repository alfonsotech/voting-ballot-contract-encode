import { viem } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("HelloWorld", () => {

async function deployContractFixture() {
    // https://hardhat.org/hardhat-runner/docs/advanced/using-viem#clients
    const publicClient = await viem.getPublicClient();
    const [owner, otherAccount] = await viem.getWalletClients();
    // https://hardhat.org/hardhat-runner/docs/advanced/using-viem#contracts
    const helloWorldContract = await viem.deployContract("HelloWorld");
    // https://www.typescriptlang.org/docs/handbook/2/functions.html#parameter-destructuring
    return {
      publicClient,
      owner,
      otherAccount,
      helloWorldContract,
    };
  }

    it("Should give a hello world", async () => {
        // const publicClient = await viem.getPublicClient();
        // const lastBlock = await publicClient.getBlock();
        // console.log(lastBlock);
        // const [owner, otherAccount] = await viem.getWalletClients();
        // console.log(owner, otherAccount);
        // const [thingA, thingB, thingC] = await viem.getWalletClients();
        // console.log(thingA, thingB, thingC);
        const { helloWorldContract } = await loadFixture(deployContractFixture);
        const helloWorldText = await helloWorldContract.read.helloWorld();
        expect(helloWorldText).to.equal("Hello World");
    })

    it("Should set owner to deployer account", async () => {
        // const helloWorldContract = await viem.deployContract("HelloWorld");
        // const [owner] = await viem.getWalletClients();
       
        const { helloWorldContract, owner } = await loadFixture(deployContractFixture);
         const contractOwner = await helloWorldContract.read.owner();
        expect(contractOwner.toLowerCase()).to.equal(owner.account.address.toLowerCase());
    })

    it("Should not allow anyone other than owner to call transferOwnership", async function () {
    
    });

    it("Should execute transferOwnership correctly", async function () { 
        
    });

    it("Should not allow anyone other than owner to change text", async function () {
    // TODO
    // throw Error("Not implemented");
  });

  it("Should change text correctly", async function () {
    // TODO
    // throw Error("Not implemented");
  });

});

