//campaign test 0x843aeb9C43D3496039F259872f3cf5ac0f1B93d8
App = {

    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:9545', // Url for web3
    account: '0x0', // current ehtereum account
    init_callback: null,

    init: function(callback=null) { 
        App.init_callback = callback
        return App.initWeb3(); 
    },
    
    initWeb3: function() { 
        if(typeof web3 != 'undefined') { // Check whether exists a provider, e.g Metamask
            App.web3Provider = window.ethereum;
            web3 = new Web3(App.web3Provider);
            try { // Permission popup
                ethereum.enable().then(async() => { console.log("DApp connected"); });
            }
            catch(error) { console.log(error); }
        }else { // Otherwise, create a new local instance of Web3
            App.web3Provider = new Web3.providers.HttpProvider(App.url); // <==
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function() {
        web3.eth.getCoinbase(async function(err, account) {
            if(err == null) {
                App.account = account;
                balance = await web3.eth.getBalance(account);
                $("#acc_eth").html("ETH "+web3.utils.fromWei(balance, 'ether'));
                $("#acc").html("Account: <a style='cursor:pointer; color:black' onclick='alert(\""+account+"\")'>click to view</a>");
            }
        });

        $.getJSON("BitCollect.json").done(function(c) {
            App.contracts["BitCollect"] = TruffleContract(c);
            App.contracts["BitCollect"].setProvider(App.web3Provider);

            $.getJSON("Campaign.json").done(function(c) {
                App.contracts["Campaign"] = TruffleContract(c);
                App.contracts["Campaign"].setProvider(App.web3Provider);   

                if(App.init_callback!=null)
                    App.init_callback();
            });
        });
    },

    /*listenForEvents: function() { 
        App.contracts["BitCollect"].deployed().then(async (instance) => {
            console.log("dEPLOYED");
        });
        return App.render(); },

    render: function() {
        App.contracts["BitCollect"].deployed().then(async(instance) =>{
            // Call the value function (value is a public attribute)
            console.log("rENDERED");
        });
           
    },*/

    createCampaign: function(organizers_list, beneficiaries_list, timestamp_end, rewards_costs, info_hashes, callback){
        App.contracts["BitCollect"].deployed().then(async(instance) =>{
            try{
                var tx_new_campaign = await instance.createCampaign(organizers_list, beneficiaries_list, timestamp_end, rewards_costs,info_hashes, {from: App.account});
                var logs = tx_new_campaign.logs
                if(logs[0].event == "campaignCreated"){
                    var address = logs[0].args.cont
                    callback(address)
                }
            }catch(err){
                alert("Something went wrong ... check the data entered and try again")
                console.log(err)
            }
        });
    },

    getCampaignInfo: function(address, callback){
        App.contracts["Campaign"].at(address).then(async(instance) =>{
            var beneficiaries = await instance.getAllBeneficiaries()
            var beneficiaries_rewards = []
            for(var i=0; i<beneficiaries.length; i++)
                beneficiaries_rewards.push(await instance.getBeneficiaryReward(beneficiaries[i]));
            
            try{
                var info = {
                    state: await instance.state(),
                    beneficiaries: beneficiaries,
                    beneficiaries_rewards: beneficiaries_rewards,
                    organizers: await instance.getAllOrganizers(),
                    rewards_prices: await instance.getAllRewardsPrices(),
                    end_date: await instance.campaign_end_timestamp(),
                    info_hashes: await instance.info_hashes(),
                    report_threshold: await instance.thresholdFraud(),
                    report_number: await instance.getReportsNumber()
                }
                callback(info);
            }catch(err){
                alert("Something went wrong ...")
                console.log(err)
            }
        });
    }
}