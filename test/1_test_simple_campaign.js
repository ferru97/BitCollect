const BitCollect = artifacts.require("BitCollect");
const Campaign = artifacts.require("Campaign");
const truffleAssert = require('truffle-assertions');
var sleep = require('sleep');

var State = {"PENDING":0, "RUNNING":1, "EXPIRED":2, "DEACTIVATED":3, "BLOCKED":4}

contract("BitCollect Test", async accounts => {
    var campaign_instance = null
    var end_date = Math.floor(Date.now() / 1000) + 5 //Test campaign lasts 5 seconds

    organizer_1 = accounts[1]
    organizer_2 = accounts[2]

    beneficiarir_1 = accounts[3]
    beneficiarir_2 = accounts[4]

    it("Simple campaing", async () => {
        let instance = await BitCollect.deployed()
        var new_contract_addr = null;

        //Create and start campaign
        let new_contract = await instance.createCampaign([organizer_1, organizer_2],[beneficiarir_1, beneficiarir_2], end_date, [], "")   
        truffleAssert.eventEmitted(new_contract, 'campaignCreated', (ev) => {
            if (ev.cont!=undefined && ev.cont.substr(0,2)=="0x"){
                new_contract_addr = ev.cont
                return true
            }else
                return false
        })

        campaign_instance = await Campaign.at(new_contract_addr);

        let org1_don = await campaign_instance.startCampaign([beneficiarir_1,beneficiarir_2],[1000,2000], {from: organizer_1, value:3000})
        truffleAssert.eventEmitted(org1_don, 'campainStatus', (ev) => {return ev.s == State["PENDING"]})

        let org2_don = await campaign_instance.startCampaign([beneficiarir_1],[2000], {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})

        //Make a couple of donations
        let donation_1 = await campaign_instance.makeDonation([beneficiarir_1,beneficiarir_2],[3000,4000], {from: accounts[5], value:7000})
        truffleAssert.eventEmitted(donation_1, 'donationSuccess')

        let donation_2 = await campaign_instance.makeDonation([beneficiarir_1],[3000], {from: accounts[6], value:3000})
        truffleAssert.eventEmitted(donation_2, 'donationSuccess')

        //Wait the end of the campaign
        sleep.sleep(5)

        //Check the beneficiarirs rewards
        let reward_ben1 = await campaign_instance.getBeneficiaryReward(beneficiarir_1)
        let reward_ben2 = await campaign_instance.getBeneficiaryReward(beneficiarir_2)

        assert.equal(reward_ben1.toString(), "9000", "incorrect beneficiarie 1 reward");
        assert.equal(reward_ben2.toString(), "6000", "incorrect beneficiarie 2 reward");

        //Beneficiaries withdraw
        let withdraw_b1 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_1})
        truffleAssert.eventEmitted(withdraw_b1, 'withdrawSuccess', (ev) => {return ev.amount.toString()=="9000"})
        
        let withdraw_b2 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_2})
        truffleAssert.eventEmitted(withdraw_b2, 'withdrawSuccess', (ev) => {return ev.amount.toString()=="6000"})

        //Deactivate campaign
        let deactivate = await campaign_instance.deactivateCampaign({from: organizer_1})
        truffleAssert.eventEmitted(deactivate, 'campainStatus', (ev) => {return ev.s == State["DEACTIVATED"]})
    });
  

  });
