//campaign test 0x843aeb9C43D3496039F259872f3cf5ac0f1B93d8
App = {

    contracts: {}, // Store contract abstractions
    web3Provider: null, // Web3 provider
    url: 'http://localhost:9545', // Url for web3
    account: '0x0', // current ehtereum account

    init: function() { return App.initWeb3(); },
    
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
            return App.listenForEvents();
        });
    },

    listenForEvents: function() { 
        App.contracts["BitCollect"].deployed().then(async (instance) => {
            console.log("dEPLOYED");
        });
        return App.render(); },

    render: function() {
        App.contracts["BitCollect"].deployed().then(async(instance) =>{
            // Call the value function (value is a public attribute)
            console.log("rENDERED");
        });
           
    },

    createCampaign: function(organizers_list, beneficiaries_list, beneficiaries_names, timestamp_end, name, desc, rewards_names, rewards_costs, image, image_hash){
        App.contracts["BitCollect"].deployed().then(async(instance) =>{
            try{
                var tx_new_campaign = await instance.createCampaign(organizers_list, beneficiaries_list, beneficiaries_names, timestamp_end, name, desc, 
                    rewards_names, rewards_costs, image, image_hash, {from: App.account});
                var logs = tx_new_campaign.logs
                if(logs[0].event == "campaignCreated"){
                    var address = logs[0].args.cont
                    alert("Campaign created successfully. Address: "+address)
                    window.location.href = "campaign.html?addr="+address;
                }
            }catch(err){
                alert("Something went wrong ... check the data entered and try again")
                console.log(err)
            }
        });
    }
}

// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
});



var organizers_list = []
var beneficiaries_list = []
var beneficiaries_names = ""
var rewards_names = []
var rewards_costs = []
var images = []
var images_hash = []

function addOrganizer(){
    var org = $("#org").val()
    if (organizers_list.includes(org)){
        alert("Error: organizer already provided")
        return
    }

    if(org.length>0){
        $("#org_list").append(org+"<br>")
        organizers_list.push(org)
    }

    $("#org").val('')
}

function addBeneficiary(){
    var ben = $("#ben").val()
    var ben_name = $("#ben_name").val()
    if (beneficiaries_list.includes(ben)){
        alert("Error: beneficiarie already provided")
        return
    }
    if(ben.length>0 && ben_name.length>0){
        $("#ben_list").append(ben_name+": "+ben+"<br>")
        beneficiaries_list.push(ben)
        beneficiaries_names += "," + ben_name
    }

    $("#ben").val('')
    $("#ben_name").val('')
}

function addReward(){
    var rew = $("#rew").val()
    var rew_price = $("#rew_price").val()
    if(rew.length>0 && rew_price>0){
        var price_wei = web3.utils.toWei(rew_price, 'ether')
        $("#rew_list").append("ETH "+rew_price+": "+rew+"<br>")
        rewards_names.push(rew)
        rewards_costs.push(price_wei)
    }

    $("#rew").val('')
    $("#rew_price").val('')
}

function createCampaign(){
    var name = $("#name").val();
    var desc = $("#desc").val();
    var date = $("#date").val();
    var image = $("#im1").val();
    var image_hash = $("#img_hash1").val();

    if(name.length==0 || organizers_list==0 || beneficiaries_list.length==0 || date.length==0){
        alert("Input the required field")
        return
    }

    var timestamp_end = Date.parse(date)/1000

    App.createCampaign(organizers_list, beneficiaries_list, beneficiaries_names, timestamp_end, name, desc, rewards_names, rewards_costs, image, image_hash)
}