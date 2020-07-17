
//campaign test 0x2105aD1883e0F497bf0A174E2f83139eB5bfC969
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
                

            
            state_index = blockchain_data.state.toNumber();

            var now = Math.floor(Date.now() / 1000)
            if(blockchain_data.end_date.toNumber()<now && (state_index==1 || state_index==2)){
                state_index = 2
                if(isBeneficiary() && blockchain_data.beneficiary_withdrawn==false)
                    $("#ben-wit").show()
            }

            if(blockchain_data.withdrawn_number == blockchain_data.beneficiaries.length && state_index!=3){
                state_index = 2
                $("#btn-close").show()
            }

            var end_date = new Date(blockchain_data.end_date.toString()*1000);
            end_date = end_date.getFullYear() + "/" + end_date.getMonth() + "/" + end_date.getDate()+ " "+end_date.getHours()+ ":" +end_date.getMinutes()  

            $("#name").text(db_data.name);
            $("#desc").html("<strong>Campaign Description</strong><br>"+db_data.description);
            if(db_data.image_link.length>0)
                $("#img").attr("src",db_data.image_link);
            $("#raised").text(total_raised+" ETH")
            $("#end_dt").text(end_date)
            $("#state").text(State[state_index])
            $("#report").text(blockchain_data.report_number.toString()+"/"+blockchain_data.report_threshold.toString())
            $("#inv-amount").text(Web3.utils.fromWei(blockchain_data.report_investment, 'ether')+" ETH")


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

            if(isBeneficiary()){
                $("#is-ben").show()
            }
               
            if(isOrganizer() && state_index==0){
                $("#donate_btn").html("START CAMPAIGN")
                $("#donate_btn").show()
            }


            if(state_index==1){
                $("#donate_btn").html("DONATE")
                $("#donate_btn").show()
                $("#rep_btn").show()
            }

            if(state_index==4){
                $("#ben-fra").show()
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

function isBeneficiary(){
    var isBeneficiary = false;
    for(var i=0; i<blockchain_data.beneficiaries.length && !isBeneficiary; i++){
        
        if(blockchain_data.beneficiaries[i].toLowerCase() == App.account)
            isBeneficiary = true
    }
    return isBeneficiary
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
    var now = Math.floor(Date.now() / 1000)
    if(blockchain_data.end_date.toNumber()<now)
        location.reload()

    if(state_index==0 && blockchain_data.organizer_donated==true){
        alert("As organizer you have already donated to start this campaign. Wait the other organizers to start the campaign")
        return
    }

    closeAllOptions()
    $("#donation").show()

    var table = '<table class="table2"><tr><th>Beneficiary</th><th>Address</th><th>ETH amount</th></tr>'

    for(var i=0; i<blockchain_data.beneficiaries.length; i++){
        var input = '<input type="number" value="0" step="0.001" min=0 id="am_'+blockchain_data.beneficiaries[i]+'" />'
        table += "<tr><td>"+db_data.bneficiaries_names[i]+"</td><td><button onclick='alert(\""+blockchain_data.beneficiaries[i]+"\")'>ADDRESS</button></td><td>"+input+"</td></tr>"
    }

    table += "</table><table class='table2'><tr><td id='em1'>E-mail address</td><td><input type='email' id='email'></td></tr></table>"
    $("#donation_table").html(table)

    if(blockchain_data.rewards_prices.length==0){
        $("#em1").hide()
        $("#em2").hide()
    }

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

    var callback = function(tx){
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
    
    if(state_index==0)
        App.startCampaign(campaign_address, beneficiary, partition, email, total_donation, callback)
    if(state_index==1)
        App.makeDonation(campaign_address, beneficiary, partition, email, total_donation, callback)
}



function closeAllOptions(){
    $("#check").hide()
    $("#ben_info").hide()
    $("#donation").hide()
    $("#report_div").hide()
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


function showReport(){
    closeAllOptions()
    if(blockchain_data.user_reported==true){
        alert("You have already reported this campaign")
        return
    }
    $("#report_div").show()
}


function reportCampaign(){
    var conf = confirm("Do you want to report this campaign?");
    if(conf){
        var callback = function(tx){
            if(tx.logs[0].event == "fraudReported"){
                alert("Campaign reported successfully!") 
                location.reload()
            }
            else
                alert("Something went wrong...")
        }
        App.reportCampaign(campaign_address, blockchain_data.report_investment.toString(), callback)
    }
}


function beneficiaryWithdraw(){    
    var amount = null
    for(var i=0; i<blockchain_data.beneficiaries.length; i++){
        if(blockchain_data.beneficiaries[i].toLowerCase() == App.account)
            amount = blockchain_data.beneficiaries_rewards[i].toString()
    }
    
    var callback = function(tx){
        if(tx.logs[0].event == "withdrawSuccess"){
            //var amount = Web3.utils.fromWei(blockchain_data.rewards_prices[i].toString(), 'ether') 
            var reward = Web3.utils.fromWei(tx.logs[0].args.amount, 'ether')
            var plus = Web3.utils.fromWei(tx.logs[0].args.plus, 'ether')
            var total = parseFloat(reward) + parseFloat(plus);
            var msg = "Withdraw carried out successfully! You have earned "+total+"ETH: "+reward+"ETH from donors and "+plus+"ETH from reports"
            alert(msg)
            location.reload();
        }
        else
            alert("Something went wrong")
    }
    App.beneficiaryWithdraw(campaign_address, callback)
}


function fraudWithdraw(){
    var callback = function(tx){
        var refound = Web3.utils.fromWei(tx.logs[0].args.amount, 'ether')
        var plus = Web3.utils.fromWei(tx.logs[0].args.plus, 'ether')
        var total = parseFloat(refound) + parseFloat(plus);
        var msg = "Refound carried out successfully! You have been refunded for "+total+"ETH"
        if(plus!="0")
            msg += ": "+refound+"ETH from donation and "+plus+"ETH as reporter gain and report investment refound"
        alert(msg)
        location.reload()
    }

    var min_donations = 1
    if(isOrganizer())
        min_donations = 2
    
    if(blockchain_data.user_donations.length<min_donations && blockchain_data.user_reported==false){
        alert("No refund available: you have not donated or reported this campaign")
        return
    }

    if(blockchain_data.user_refunded==true){
        alert("You have already been refunded")
        return
    }
        

    var conf = confirm("Do you want to refund?")
    if(conf)
        App.fraudWithdraw(campaign_address, callback)
}



function closeCampaign(){
    var callback = function(tx){
        if(tx.logs[0].event=="campainStatus" && tx.logs[0].args.s.toString()=="3"){
            alert("Campaign closed successfully!")
            location.reload()
        }else
            alert("Something went wrong...")
    }
    App.closeCampaign(campaign_address, callback)
}


window.ethereum.on('accountsChanged', function (accounts) {location.reload()})
