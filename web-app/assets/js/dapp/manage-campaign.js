
//campaign test 0xF7BDC5fEbff44E2482D0c5D7b89ab1a36B6179EC
var State = ["PENDING", "RUNNING", "EXPIRED", "DEACTIVATED", "BLOCKED"]
var state_index = null;
var campaign_address = null
var db_data = null;
var blockchain_data = null;

$(function() {
    $(window).on('load',function () {
        var url_string = window.location.href;
        var url = new URL(url_string);
        campaign_address = url.searchParams.get("addr");
        
        if(campaign_address==null){
            alert("No campaign address found");
            window.location.href = "index.html";
        }

        App.init(getCampaignInfo);
    });
});


function getCampaignInfo(){
   App.getCampaignInfo(campaign_address, setCampaignInfo)
}

function setCampaignInfo(info){
    blockchain_data = info
    console.log(info)
    $.ajax({
        type: "POST",  
        data: {address: campaign_address},
        url: "http://localhost:3005/api/get-campaign",
        dataType: "json",
        success: function(data){  
            console.log(data)
            db_data = data
            var total_raised = 0;
            for(var i=0; i<blockchain_data.beneficiaries_rewards.length; i++)
                total_raised += parseFloat(Web3.utils.fromWei(blockchain_data.beneficiaries_rewards[i], 'ether'))
                

            var end_date = new Date(blockchain_data.end_date.toString() * 1000);
            end_date = end_date.getFullYear() + "/" + end_date.getMonth() + "/" + end_date.getDate()

            state_index = blockchain_data.state.toNumber();

            $("#name").text(db_data.name);
            $("#desc").text(db_data.description);
            if(db_data.image_link.length>0)
                $("#img").attr("src",db_data.image_link);
            $("#raised").text(total_raised+" ETH")
            $("#end_dt").text(end_date)
            $("#state").text(State[state_index])
            $("#report").text(blockchain_data.report_number.toString()+"/"+blockchain_data.report_threshold.toString())


            var rewards = ""
            for(var i=0; i<db_data.rewards_name.length; i++){
                var reward_price = Web3.utils.fromWei(blockchain_data.rewards_prices[i].toString(), 'ether')
                rewards += '<div class="reward-block"><h3>'+reward_price+' ETH</h3><h2>'+db_data.rewards_name[i]+'</h2></div>'
            }
            if(rewards.length==0)
                $("#no-rew").show()   
            else
                $("#rew-list").html(rewards)

            if(isOrganizer()){
                $("#is-org").css("display","inline")
                $("#don_2").show()
            }
                

            if(isOrganizer() && state_index==0){
                $("#donate_btn").html("START CAMPAIGN")
                $("#donate_btn").show()
            }
            if(state_index==1){
                $("#donate_btn").html("DONATE")
                $("#donate_btn").show()
                $("#rep-btn").show()
            }

            $("#operations").show()

            printUserDonations()
    
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("Status: " + textStatus); alert("Error: " + errorThrown); 
        }       
    });
}

function isOrganizer(){
    var isOrganizer = false;
    for(var i=0; i<blockchain_data.organizers.length && !isOrganizer; i++){
        
        if(blockchain_data.organizers[i].toLowerCase() == App.account)
            isOrganizer = true
    }
    return isOrganizer
}


function infoChecksum(){
    closeAllOptions()
    $("#check").show()

    var good = '<p style="font-size: 13pt; color: green;"><strong>GOOD</strong></p>'
    var bad = '<p style="font-size: 13pt; color: red;"><strong>TAMPERED!</strong></p>'
    var md5s = blockchain_data.info_hashes.split(',')
    
    if(CryptoJS.MD5(db_data.name) == md5s[0])
        $("#ch_name").html(good)
    else
        $("#ch_name").html(bad)
    
    if(CryptoJS.MD5(db_data.organizers_names.join()) == md5s[1])
        $("#ch_org").html(good)
    else
        $("#ch_org").html(bad)

    if(CryptoJS.MD5(db_data.bneficiaries_names.join()) == md5s[2])
        $("#ch_ben").html(good)
    else
        $("#ch_ben").html(bad)
    
    if(CryptoJS.MD5(db_data.description) == md5s[3])
        $("#ch_desc").html(good)
    else
        $("#ch_desc").html(bad)

    if(CryptoJS.MD5(db_data.rewards_name.join()) == md5s[4])
        $("#ch_rew").html(good)
    else
        $("#ch_rew").html(bad)

    if(CryptoJS.MD5(db_data.image_link) == md5s[5])
        $("#ch_img").html(good)
    else
        $("#ch_img").html(bad)
}


function beneficiariesInfo(){
    closeAllOptions()
    $("#ben_info").show()
    var table = '<table class="table2"><tr><th>Type</th><th>Name</th><th>Address</th><th>ETH raised</th></tr>'

    for(var i=0; i<blockchain_data.organizers.length; i++){
        table += "<tr><td>Organizer</td><td>"+db_data.organizers_names[i]+"</td><td><button onclick='alert(\""+blockchain_data.organizers[i]+"\")'>ADDRESS</button></td><td>--</td></tr>"
    }

    for(var i=0; i<blockchain_data.beneficiaries.length; i++){
        var eth_raised = Web3.utils.fromWei(blockchain_data.beneficiaries_rewards[i].toString(), 'ether')
        table += "<tr><td>Beneficiary</td><td>"+db_data.bneficiaries_names[i]+"</td><td><button onclick='alert(\""+blockchain_data.beneficiaries[i]+"\")'>ADDRESS</button></td><td>"+eth_raised+" ETH</td></tr>"
    }

    table += "</table>"
    $("#ben_info_table").html(table)

}

function createDonation(){
    closeAllOptions()
    $("#donation").show()

    var table = '<table class="table2"><tr><th>Beneficiary</th><th>Address</th><th>ETH amount</th></tr>'

    for(var i=0; i<blockchain_data.beneficiaries.length; i++){
        var input = '<input type="number" value="0" step="0.001" min=0 id="am_'+blockchain_data.beneficiaries[i]+'" />'
        table += "<tr><td>"+db_data.bneficiaries_names[i]+"</td><td><button onclick='alert(\""+blockchain_data.beneficiaries[i]+"\")'>ADDRESS</button></td><td>"+input+"</td></tr>"
    }

    table += "</table><table class='table2'><tr><td>E-mail address</td><td><input type='email' id='email'></td></tr></table>"
    $("#donation_table").html(table)

    if(blockchain_data.rewards_prices.length==0)
        $("#email").hide()

}


function makeDonation(){
    var beneficiary = [];
    var partition = [];
    for(var i=0; i<blockchain_data.beneficiaries.length; i++){
        var eth = $("#am_"+blockchain_data.beneficiaries[i]).val().toString()
        var wei = Web3.utils.toWei(eth, 'ether');
        beneficiary.push(blockchain_data.beneficiaries[i])
        partition.push(wei)
    }

    var total_donation = partition.reduce((a, b) => parseInt(a) + parseInt(b), 0)
    if(total_donation<=0)
        return;
    
    var email = ""
    if(blockchain_data.rewards_prices.length > 0){
        email = $("#email").val()
        var min_rew_price = blockchain_data.rewards_prices[0]
        if(total_donation >= min_rew_price && email.length==0){
            alert("You can unlock a reward! Inser an email address in order to be contacted for the reward manadgement")
            return
        }
    }
    

    if(state_index==0)
        App.startCampaign(campaign_address, beneficiary, partition, email, total_donation, donationSuccess_callback)
    if(state_index==1)
        App.makeDonation(campaign_address, beneficiary, partition, email, total_donation, donationSuccess_callback)
}



function donationSuccess_callback(tx){
    if(tx.logs[0].event == "donationSuccess" || tx.logs[1].event == "donationSuccess"){
        var msg = "Donation made successfully!"
        if(tx.logs[0].event == "donationRewardUnlocked")
            msg += " You have unlocked some rewards!"
        alert(msg) 
        location.reload()
    }
    else
        alert("Something went wrong...")
}

function closeAllOptions(){
    $("#check").hide()
    $("#ben_info").hide()
    $("#donation").hide()
}


function printUserDonations(){

    if(blockchain_data.user_donations.length>0)
        $("#no-don").hide()
    else
        return
    
    var donations = '<strong>Donations</strong> <ul>'
    for(var i=0; i<blockchain_data.user_donations.length; i++){
        var amount = Web3.utils.fromWei(blockchain_data.user_donations[i], 'ether')
        donations += "<li>"+amount+" ETH</li>"
    }
    donations += "</ul>"  

    if(blockchain_data.user_rewards.length>0){
        donations += "<br><br><strong>Rewards</strong> <ul>"
        var rewards_cardinality = new Array(db_data.rewards_name.length).fill(0);

        for(var i=0; i<blockchain_data.user_rewards.length; i++){
            var max_rew_index = blockchain_data.user_rewards[i].toNumber()

            for(var k=0; k<=max_rew_index; k++)
                rewards_cardinality[k]++
        }

        for(var i=0; i<db_data.rewards_name.length; i++){
            if(rewards_cardinality[i]>0){
                donations += "<li>"+rewards_cardinality[i]+"x"+db_data.rewards_name[i]+"</li>"
            }
        }
        donations += "</ul>"  
    }
    
    $("#don-rew_list").html(donations)

}


function reportCampaign(){
    var confirm = confirm("Do you want to report this campaign?");
}

