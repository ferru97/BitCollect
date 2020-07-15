const Migrations = artifacts.require("Migrations");
const BitCollect = artifacts.require("BitCollect");

const default_fraud_threshold = 5
const default_fraud_investment = "50000000000000000"  //0.05 eth

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(BitCollect, default_fraud_threshold, default_fraud_investment);
};
