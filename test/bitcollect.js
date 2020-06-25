const BitCollect = artifacts.require("BitCollect");
const truffleAssert = require('truffle-assertions');

var State = {"PENDING":0, "RUNNING":1, "ENDED":2}


contract("BitCollect Test", async accounts => {
    
    organizer_1 = accounts[1]
    organizer_2 = accounts[2]

    beneficiarir_1 = accounts[3]
    beneficiarir_2 = accounts[4]

    it("Should start campaign after oranizers donation", async () => {
        let instance = await BitCollect.deployed()

        let org1_don = await instance.startCampaign([beneficiarir_1,beneficiarir_2],[1000,2000], {from: organizer_1, value:3000})
        truffleAssert.eventEmitted(org1_don, 'campainStatus', (ev) => {return ev.s == State["PENDING"]})

        let org2_don = await instance.startCampaign([beneficiarir_1],[2000], {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})
    });

  

  });
