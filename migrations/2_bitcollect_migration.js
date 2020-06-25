const Migrations = artifacts.require("Migrations");
const BitCollect = artifacts.require("BitCollect");
const Library = artifacts.require("Library");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Library);
  deployer.link(Library, BitCollect);
  deployer.deploy(BitCollect, ["0xf23A36F9De265FA19C60c9D59488b893474A1571","0x794d6D8779fe7BD1a51C42Be5aa3c581dDf2d17d"],
  ["0x7b0de20E954157fcF6b46E4eB7a1b362bcd76C42","0xf4838eCd7f9EfCFCd445305b5cC4B1a763299E4A"],1593337108);
};
