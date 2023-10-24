import { ethers } from "hardhat";

async function main() {
  const SimpleMetobadgeV1Payable = await ethers.getContractFactory(
    "SimpleMetobadgeV1Payable"
  );
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(100000000000000);
  await priceOracle.deployed();
  const priceOracleAddress = priceOracle.address;
  console.log(`priceOracleAddress deployed to ${priceOracleAddress}`);

  const leaderboardbadge = await SimpleMetobadgeV1Payable.deploy(
    priceOracleAddress
  );
  await leaderboardbadge.deployed();
  const leaderboardbadgeAddr = leaderboardbadge.address;
  console.log(`leaderboardbadge deployed to ${leaderboardbadgeAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
