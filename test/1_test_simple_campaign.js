const BitCollect = artifacts.require("BitCollect");
const Campaign = artifacts.require("Campaign");
const truffleAssert = require('truffle-assertions');

var State = {"PENDING":0, "RUNNING":1, "EXPIRED":2, "DEACTIVATED":3, "BLOCKED":4}

contract("BitCollect Test", async accounts => {
    var campaign_instance = null
    var start_date = 1595699440

    organizer_1 = accounts[1]
    organizer_2 = accounts[2]

    beneficiarir_1 = accounts[3]
    beneficiarir_2 = accounts[4]

    it("Simple campaing", async () => {
        let instance = await BitCollect.deployed()
        var new_contract_addr = null;

        //Create and start campaign
        let new_contract = await instance.createCampaign([organizer_1, organizer_2],[beneficiarir_1, beneficiarir_2], start_date, [], "")   
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

        let org2_don = await campaign_instance.startCampaign([beneficiarir_1],[2000], "", {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})

        //Make a couple of donations
        let donation_1 = await campaign_instance.makeDonation([beneficiarir_1,beneficiarir_2],[3000,4000], "", {from: accounts[5], value:7000})
        truffleAssert.eventEmitted(donation_1, 'donationSuccess')

        let donation_2 = await campaign_instance.makeDonation([beneficiarir_1],[3000], "", {from: accounts[6], value:3000})
        truffleAssert.eventEmitted(donation_2, 'donationSuccess')

        //End the campaign
        let end_campaign = await campaign_instance.endCampaign({from: organizer_1})
        truffleAssert.eventEmitted(end_campaign, 'campainStatus', (ev) => {return ev.s == State["EXPIRED"]})

        //Check the beneficiarirs rewards
        let beneficiaries = await campaign_instance.getAllBeneficiaries()
        let beneficiaries_rewards = await campaign_instance.getBeneficiariesRewards(beneficiaries)
        reward_ben1 = beneficiaries_rewards[0].words[0]
        reward_ben2 = beneficiaries_rewards[1].words[0]

        assert.equal(reward_ben1, 9000, "incorrect beneficiarie 1 reward");
        assert.equal(reward_ben2, 6000, "incorrect beneficiarie 2 reward");

        //Beneficiaries withdraw
        let withdraw_b1 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_1})
        truffleAssert.eventEmitted(withdraw_b1, 'withdrawSuccess', (ev) => {return ev.beneficiary==beneficiarir_1 && ev.amount==9000})
        
        let withdraw_b2 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_2})
        truffleAssert.eventEmitted(withdraw_b2, 'withdrawSuccess', (ev) => {return ev.beneficiary==beneficiarir_2 && ev.amount==6000})

        //Deactivate campaign
        let deactivate = await campaign_instance.deactivateCampaign({from: organizer_1})
        truffleAssert.eventEmitted(deactivate, 'campainStatus', (ev) => {return ev.s == State["DEACTIVATED"]})
    });
  

  });
