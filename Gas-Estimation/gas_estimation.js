
const Web3 = require('web3');
var sleep = require('sleep');

const default_fraud_threshold = 2
const default_fraud_investment = "50000000000000000"  //0.05 eth

const fs = require('fs');
const BitCollect_JSON = JSON.parse(fs.readFileSync('./build/contracts/BitCollect.json', 'utf8'));
const BitCollect_ABI = BitCollect_JSON.abi;
const BitCollect_Bytecode = BitCollect_JSON.bytecode;

const Campaign_JSON = JSON.parse(fs.readFileSync('./build/contracts/Campaign.json', 'utf8'));
const Campaign_ABI = Campaign_JSON.abi;
const Campaign_Bytecode = Campaign_JSON.bytecode;

const web3 = new Web3('ws://localhost:9545');
const gas_price = 40000000000 //40 gwei
const max_gas = 6700000
const eth_to_eur = 205.06

function gestCost(gasAmount){
    var eth = gasAmount * web3.utils.fromWei(gas_price.toString(), 'ether')
    var eur = (eth * eth_to_eur).toFixed(2)
    return gasAmount+" gas ("+eth+" ETH = "+eur+" EUR)"
}

async function EstimateGas(){
    const accounts = await web3.eth.getAccounts()

    var Bitcollect = await new web3.eth.Contract(BitCollect_ABI);

    var Bitcollect_instance = await Bitcollect.deploy({
        data: BitCollect_Bytecode,
        arguments: [default_fraud_threshold, default_fraud_investment]
    }).send({
        from: accounts[4], 
        gasPrice: gas_price, gas: max_gas
    });
    
    const end_date = Math.floor(Date.now() / 1000) + 5 //Test campaign lasts 5 seconds
    const checksum = "27152da6774ecc7e4a15a8c00587d926,27152da6774ecc7e4a15a8c00587d926,27152da6774ecc7e4a15a8c00587d926,27152da6774ecc7e4a15a8c00587d926,27152da6774ecc7e4a15a8c00587d926,27152da6774ecc7e4a15a8c00587d926"
    const pointO_wei = "100000000000000000"
    const tw_pointO_wei = "200000000000000000"

    console.log("-----BitCollect factory functionalities gas estimation-----")
    var main_consuption = null
    await Bitcollect_instance.methods.createCampaign([accounts[1]], [accounts[1]], end_date, [], checksum)
    .estimateGas({from : accounts[0]}, async function(error, gasAmount){
        console.log("Deploy campaign with 1 organizer and 1 beneficiary: "+gestCost(gasAmount))
        main_consuption = gasAmount 
    });
    await Bitcollect_instance.methods.createCampaign([accounts[1],accounts[2]], [accounts[1]], end_date, [], checksum)
    .estimateGas({from : accounts[0]}, function(error, gasAmount){
        console.log("\t+Adding an organizer costs an extra "+gestCost(gasAmount - main_consuption))
    });

    await Bitcollect_instance.methods.createCampaign([accounts[1],accounts[2]], [accounts[1]], end_date, [], checksum)
    .estimateGas({from : accounts[0]}, function(error, gasAmount){
        console.log("\t+Adding a beneficiary costs an extra "+gestCost(gasAmount - main_consuption))
    });

    await Bitcollect_instance.methods.setFraudThreshold(5).estimateGas({from : accounts[4]}, async function(error, gasAmount){
        console.log("\nChange the fraud reports threshold: "+gestCost(gasAmount))
    });

    await Bitcollect_instance.methods.setFraudInvestment(pointO_wei).estimateGas({from : accounts[4]}, async function(error, gasAmount){
        console.log("Change the required investment to report a campaign: "+gestCost(gasAmount))
    });


    console.log("\n\n-----Campaign functionalities gas estimation-----")
    var Campaign = await new web3.eth.Contract(Campaign_ABI);
    var Campaign_instance = await Campaign.deploy({
        data: Campaign_Bytecode,
        arguments: [[accounts[3],accounts[2]], [accounts[1],accounts[2]], end_date, ["10000"], 5, checksum, pointO_wei]
    }).send({from: accounts[4], gasPrice: gas_price, gas: max_gas});

    main_consuption = null
    await Campaign_instance.methods.startCampaign([accounts[1]], [pointO_wei], "").estimateGas({from:accounts[2], value:pointO_wei}, function(error, gasAmount){
        console.log("Start campaign donating to 1 beneficiary: "+gestCost(gasAmount))
        main_consuption = gasAmount
    })
    await Campaign_instance.methods.startCampaign([accounts[1]], [pointO_wei], "").send({from:accounts[2], value:pointO_wei, gasPrice: gas_price, gas: max_gas})
    
    await Campaign_instance.methods.startCampaign([accounts[1], accounts[2]], [pointO_wei, pointO_wei], "").estimateGas({from:accounts[3], value:tw_pointO_wei}, function(error, gasAmount){
        console.log("\t+Adding 1 beneficiary to start campaign: "+gestCost(gasAmount-main_consuption))
    })
    await Campaign_instance.methods.startCampaign([accounts[1], accounts[2]], [pointO_wei, pointO_wei], "").send({from:accounts[3], value:pointO_wei*2, gasPrice: gas_price, gas: max_gas})

    
    main_consuption = null
    await Campaign_instance.methods.makeDonation([accounts[1]], [1000], "").estimateGas({from : accounts[1], value:1000}, function(error, gasAmount){
        console.log("\nMake donation to 1 beneficiary: "+gestCost(gasAmount))
    });
    await Campaign_instance.methods.makeDonation([accounts[1]], [1000], "").send({from:accounts[1], value:1000, gasPrice: gas_price, gas: max_gas})

    await Campaign_instance.methods.makeDonation([accounts[1],accounts[2]], [1000,1000], "").estimateGas({from : accounts[4], value:2000}, function(error, gasAmount){
        console.log("\t+Add 1 beneficiary to the donation: "+gestCost(gasAmount-main_consuption))
    });
    await Campaign_instance.methods.makeDonation([accounts[1]], [10000], "").estimateGas({from : accounts[5], value:10000}, function(error, gasAmount){
        console.log("\t+Unlock 1 reward with the danation: "+gestCost(gasAmount-main_consuption))
    });

    console.log("\nWait campaign end...")
    sleep.sleep(10)

    await Campaign_instance.methods.beneficiaryWithdraw().estimateGas({from : accounts[1]}, function(error, gasAmount){
        console.log("\nBeneficiary withdraw: "+gestCost(gasAmount-main_consuption))
    });
    await Campaign_instance.methods.beneficiaryWithdraw().send({from:accounts[1], gasPrice: gas_price, gas: max_gas})
    await Campaign_instance.methods.beneficiaryWithdraw().send({from:accounts[2], gasPrice: gas_price, gas: max_gas})

    //Cost campaign deactivation
    await Campaign_instance.methods.deactivateCampaign().estimateGas({from : accounts[2]}, function(error, gasAmount){
        console.log("\nDeactivate campaign: "+gestCost(gasAmount-main_consuption))
    });



    console.log("\n\n-----Fraudolent campaign functionalities gas estimation-----")
    const end_date2 = Math.floor(Date.now() / 1000) + 5 //Test campaign lasts 5 seconds
    var Campaign = await new web3.eth.Contract(Campaign_ABI);
    var Campaign_instance = await Campaign.deploy({
        data: Campaign_Bytecode,
        arguments: [[accounts[3],accounts[2]], [accounts[1],accounts[2]], end_date2, ["10000"], 2, checksum, pointO_wei]
    }).send({from: accounts[4], gasPrice: gas_price, gas: max_gas});

    //Start campaign
    await Campaign_instance.methods.startCampaign([accounts[1]], [pointO_wei], "").send({from:accounts[2], value:pointO_wei, gasPrice: gas_price, gas: max_gas})
    await Campaign_instance.methods.startCampaign([accounts[1], accounts[2]], [pointO_wei, pointO_wei], "").send({from:accounts[3], value:pointO_wei*2, gasPrice: gas_price, gas: max_gas})

    //Make some donations
    await Campaign_instance.methods.makeDonation([accounts[1]], [1000], "").send({from:accounts[3], value:1000, gasPrice: gas_price, gas: max_gas})
    await Campaign_instance.methods.makeDonation([accounts[1]], [1000], "").send({from:accounts[4], value:1000, gasPrice: gas_price, gas: max_gas})

    await Campaign_instance.methods.reportFraud().estimateGas({from : accounts[5], value:pointO_wei}, function(error, gasAmount){
        console.log("Report campaign: "+gestCost(gasAmount-main_consuption))
    });
    await Campaign_instance.methods.reportFraud().send({from:accounts[4], value:pointO_wei, gasPrice: gas_price, gas: max_gas})
    await Campaign_instance.methods.reportFraud().send({from:accounts[5], value:pointO_wei, gasPrice: gas_price, gas: max_gas})

    console.log("Campaign blocked, refund users")
    await Campaign_instance.methods.fraudWithdraw().estimateGas({from : accounts[3], value:pointO_wei}, function(error, gasAmount){
        console.log("\tRefund user with 1 donation: "+gestCost(gasAmount-main_consuption))
    }); 
    await Campaign_instance.methods.fraudWithdraw().estimateGas({from : accounts[4], value:pointO_wei}, function(error, gasAmount){
        console.log("\tRefund user reporter with 1 donation: "+gestCost(gasAmount-main_consuption))
    });
    await Campaign_instance.methods.fraudWithdraw().estimateGas({from : accounts[5], value:pointO_wei}, function(error, gasAmount){
        console.log("\tRefund user only reporter: "+gestCost(gasAmount-main_consuption))
    });


    process.exit(0);
  
}

EstimateGas()


