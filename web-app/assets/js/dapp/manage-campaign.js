
//campaign test 0xF7BDC5fEbff44E2482D0c5D7b89ab1a36B6179EC
var State = ["PENDING", "RUNNING", "EXPIRED", "DEACTIVATED", "BLOCKED"]
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
            for(var i=0; i<info.beneficiaries_rewards.length; i++)
                total_raised += info.beneficiaries_rewards[i].words[0]

            var end_date = new Date(info.end_date.words[0] * 1000);
            end_date = end_date.getFullYear() + "/" + end_date.getMonth() + "/" + end_date.getDate()

            var state_index = info.state.words[0];

            $("#name").text(data.name);
            $("#desc").text(data.description);
            if(data.image_link.length>0)
                $("#img").attr("src",data.image_link);
            $("#raised").text(Web3.utils.fromWei(total_raised.toString(), 'ether')+ " ETH")
            $("#end_dt").text(end_date)
            $("#state").text(State[state_index])


            var rewards = ""
            for(var i=0; i<db_data.rewards_name.length; i++){
                var reward_price = Web3.utils.fromWei(blockchain_data.rewards_prices[i].words[0].toString(), 'ether')
                rewards += '<div class="reward-block"><h3>'+reward_price+' ETH</h3><h2>'+db_data.rewards_name[i]+'</h2></div>'
            }
            if(rewards.length==0)
                $("#no-rew").show()   
            else
                $("#rew-list").html(rewards)

            $("#operations").show()
    
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("Status: " + textStatus); alert("Error: " + errorThrown); 
        }       
    });
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
        table += "<tr><td>Beneficiary</td><td>"+db_data.bneficiaries_names[i]+"</td><td><button onclick='alert(\""+blockchain_data.beneficiaries[i]+"\")'>ADDRESS</button></td><td>"+blockchain_data.beneficiaries_rewards[0].words[0]+"</td></tr>"
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

    table += "</table>"
    $("#donation_table").html(table)

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

    console.log(beneficiary)
    console.log(partition)
}

function closeAllOptions(){
    $("#check").hide()
    $("#ben_info").hide()
    $("#donation").hide()
}


