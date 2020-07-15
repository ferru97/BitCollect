const BitCollect = artifacts.require("BitCollect");
const Campaign = artifacts.require("Campaign");
const truffleAssert = require('truffle-assertions');
var sleep = require('sleep');

var State = {"PENDING":0, "RUNNING":1, "EXPIRED":2, "DEACTIVATED":3, "BLOCKED":4}

contract("BitCollect Test", async accounts => {
    var campaign_instance = null

    organizer_1 = accounts[1]
    organizer_2 = accounts[2]

    beneficiarir_1 = accounts[3]
    beneficiarir_2 = accounts[4]

    it("Block fraudolent campaign", async () => {
        var end_date = Math.floor(Date.now() / 1000) + 5 //Test campaign lasts 5 seconds
        let instance = await BitCollect.deployed()
        var new_contract_addr = null;

        //Set fraud threshold to 2 (for faster testing)
        await instance.setThreshold(2);

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

        let org1_don = await campaign_instance.startCampaign([beneficiarir_1,beneficiarir_2],[1000,2000], "", {from: organizer_1, value:3000})
        truffleAssert.eventEmitted(org1_don, 'campainStatus', (ev) => {return ev.s == State["PENDING"]})

        let org2_don = await campaign_instance.startCampaign([beneficiarir_1],[2000], "", {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})
        truffleAssert.eventNotEmitted(org2_don, 'donationRewardUnlocked')

        //Make a couple of donations
        let donation_1 = await campaign_instance.makeDonation([beneficiarir_1],[4000], "", {from: accounts[5], value:4000})
        truffleAssert.eventEmitted(donation_1, 'donationSuccess')

        let donation_2 = await campaign_instance.makeDonation([beneficiarir_1, beneficiarir_2],[3000, 4000], "", {from: accounts[6], value:7000})
        truffleAssert.eventEmitted(donation_2, 'donationSuccess')

        let donation_3 = await campaign_instance.makeDonation([beneficiarir_1],[1000], "", {from: accounts[6], value:1000})
        truffleAssert.eventEmitted(donation_3, 'donationSuccess')


        //Make some reports
        let report_1 = await campaign_instance.reportFraud({from: accounts[5], value:1000}) //donors & reporter
        truffleAssert.eventEmitted(report_1, 'fraudReported', (ev) => {return ev.s == State["RUNNING"]})

        let report_2 = await campaign_instance.reportFraud({from: accounts[7], value:1000})//reporter
        truffleAssert.eventEmitted(report_2, 'fraudReported', (ev) => {return ev.s == State["BLOCKED"]})

        //Execute make some reports
        let init_donation_subdivision = 2500 //Division of thi initial donation for the reporter (300+2000)/2

        let withdraw_1 = await campaign_instance.fraudWithdraw({from: accounts[5]}) //test withdraw donor&reporter
        truffleAssert.eventEmitted(withdraw_1, 'refoundEmitted', (ev) => {return ev.amount == 4000 && ev.plus == init_donation_subdivision})

        let withdraw_2 = await campaign_instance.fraudWithdraw({from: accounts[6]}) //test withdraw donor
        truffleAssert.eventEmitted(withdraw_2, 'refoundEmitted', (ev) => {return ev.amount == 8000 && ev.plus == 0})

        let withdraw_3 = await campaign_instance.fraudWithdraw({from: accounts[7]}) //test withdraw reporter
        truffleAssert.eventEmitted(withdraw_3, 'refoundEmitted', (ev) => {return ev.amount == 0 && ev.plus == init_donation_subdivision})

    });


    it("Campaign reported but not declared fraudolent", async () => {
        var end_date = Math.floor(Date.now() / 1000) + 10 //Test campaign lasts 5 seconds
        let instance = await BitCollect.deployed()
        var new_contract_addr = null;

        //Set fraud threshold to 3
        await instance.setThreshold(3);

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

        let org1_don = await campaign_instance.startCampaign([beneficiarir_1,beneficiarir_2],[1000,2000], "", {from: organizer_1, value:3000})
        truffleAssert.eventEmitted(org1_don, 'campainStatus', (ev) => {return ev.s == State["PENDING"]})

        let org2_don = await campaign_instance.startCampaign([beneficiarir_1],[2000], "", {from: organizer_2, value:2000})
        truffleAssert.eventEmitted(org2_don, 'campainStatus', (ev) => {return ev.s == State["RUNNING"]})
        truffleAssert.eventNotEmitted(org2_don, 'donationRewardUnlocked')

        //Make a couple of donations
        let donation_1 = await campaign_instance.makeDonation([beneficiarir_1],[4000], "", {from: accounts[5], value:4000})
        truffleAssert.eventEmitted(donation_1, 'donationSuccess')

        let donation_2 = await campaign_instance.makeDonation([beneficiarir_1, beneficiarir_2],[3000, 4000], "", {from: accounts[6], value:7000})
        truffleAssert.eventEmitted(donation_2, 'donationSuccess')

        //Make some reports
        let report_1 = await campaign_instance.reportFraud({from: accounts[5], value:1000}) 
        truffleAssert.eventEmitted(report_1, 'fraudReported', (ev) => {return ev.s == State["RUNNING"]})

        let report_2 = await campaign_instance.reportFraud({from: accounts[7], value:3000})
        truffleAssert.eventEmitted(report_2, 'fraudReported', (ev) => {return ev.s == State["RUNNING"]})

        //Wait the end of the campaign
        sleep.sleep(10)

        //Beneficiaries withdraw
        let report_amount_plus = 2000 //reporter invesments divided by all beneficiaries 4000/2

        let withdraw_b1 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_1})
        truffleAssert.eventEmitted(withdraw_b1, 'withdrawSuccess', (ev) => {return ev.beneficiary==beneficiarir_1 && ev.amount==10000+report_amount_plus})
        
        let withdraw_b2 = await campaign_instance.beneficiaryWithdraw({from: beneficiarir_2})
        truffleAssert.eventEmitted(withdraw_b2, 'withdrawSuccess', (ev) => {return ev.beneficiary==beneficiarir_2 && ev.amount==6000+report_amount_plus})

        //Deactivate campaign
        let deactivate = await campaign_instance.deactivateCampaign({from: organizer_1})
        truffleAssert.eventEmitted(deactivate, 'campainStatus', (ev) => {return ev.s == State["DEACTIVATED"]})

    });
  

  });
