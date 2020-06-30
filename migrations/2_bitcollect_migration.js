const Migrations = artifacts.require("Migrations");
const BitCollect = artifacts.require("BitCollect");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(BitCollect);
};
