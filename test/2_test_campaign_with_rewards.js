const BitCollect = artifacts.require("BitCollect");
const Campaign = artifacts.require("Campaign");
const truffleAssert = require('truffle-assertions');

var State = {"PENDING":0, "RUNNING":1, "EXPIRED":2, "DEACTIVATED":3, "BLOCKED":4}

contract("BitCollect Test", async accounts => {
    var campaign_instance = null

    organizer_1 = accounts[1]
    organizer_2 = accounts[2]

    beneficiarir_1 = accounts[3]
    beneficiarir_2 = accounts[4]

    it("Campaign with donations rewards", async () => {
        var end_date = Math.floor(Date.now() / 1000) + 5 //Test campaign lasts 5 seconds
        let instance = await BitCollect.deployed()
        var new_contract_addr = null;

        //Create and start campaign
        let new_contract = await instance.createCampaign([organizer_1, organizer_2],[beneficiarir_1, beneficiarir_2], end_date,[4000,6000], "")   
        truffleAssert.eventEmitted(new_contract, 'campaignCreated', (ev) => {
            if (ev.cont!=undefined && ev.cont.substr(0,2)=="0x"){
                new_contract_addr = ev.cont
                return true
            }else
                return false
        })

        campaign_instance = await Campaign.at(new_contract_addr);

        let org1_don = await campaign_instance.startCampaign([beneficiarir_1,beneficiarir_2],[1000,2000], "", {from: organizer_1, value:3000})
        truffleAssert.eventEmitted(org1_don, 'campainStatus', (ev) => {return ev.s == State["PENDING"]})
        truffleAssert.eventNotEmitted(org1_don, 'donationRewardUnlocked')

        let org2_don = await campaign_instance.startCampaign([beneficiarir_1],[2000], "", {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})
        truffleAssert.eventNotEmitted(org2_don, 'donationRewardUnlocked')

        //Make a couple of donations
        let donation_1 = await campaign_instance.makeDonation([beneficiarir_1],[4000], "acc5@test.com", {from: accounts[5], value:4000})
        truffleAssert.eventEmitted(donation_1, 'donationSuccess')
        truffleAssert.eventEmitted(donation_1, 'donationRewardUnlocked')

        let donation_2 = await campaign_instance.makeDonation([beneficiarir_1, beneficiarir_2],[3000, 4000], "acc6@test.com", {from: accounts[6], value:7000})
        truffleAssert.eventEmitted(donation_2, 'donationSuccess')
        truffleAssert.eventEmitted(donation_2, 'donationRewardUnlocked')

        let donation_3 = await campaign_instance.makeDonation([beneficiarir_1],[4000], "acc5@test.com", {from: accounts[6], value:4000})
        truffleAssert.eventEmitted(donation_3, 'donationSuccess')
        truffleAssert.eventEmitted(donation_3, 'donationRewardUnlocked')

        //Check users rewards
        let rewards_don1 = await campaign_instance.getDonationReward({from: accounts[5]})
        assert.equal(rewards_don1[0].words[0], 0, "incorrect reward");
        let rewards_don2 = await campaign_instance.getDonationReward({from: accounts[6]})
        assert.equal(rewards_don2[0].words[0], 1, "incorrect reward");
        assert.equal(rewards_don2[1].words[0], 0, "incorrect reward");
    });
  

  });
