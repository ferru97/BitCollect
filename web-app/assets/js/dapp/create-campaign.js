var organizers_list = []
var organizers_names = []
var beneficiaries_list = []
var beneficiaries_names = []
var rewards_names = []
var rewards_costs = []
var images = []
var images_hash = []
var doc = null;

function addOrganizer(){
    var org = $("#org").val()
    var org_name = $("#org_name").val()

    if (organizers_list.includes(org)){
        alert("Error: organizer already provided")
        return
    }

    if(org.length>0 && org_name.length>0){
        $("#org_list").append(org+": "+org+"<br>")
        organizers_list.push(org)
        organizers_names.push(org_name)
    }

    $("#org").val('')
    $("#org_name").val('')
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
        beneficiaries_names.push(ben_name)
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
    var name = $("#name").val().replace(',','');
    var desc = $("#desc").val().replace(',','');
    var date = $("#date").val().replace(',','');
    var image = $("#im1").val().replace(',','');

    if(name.length==0 || organizers_list==0 || beneficiaries_list.length==0 || date.length==0){
        alert("Input the required field")
        return
    }

    var timestamp_end = Date.parse(date)/1000

    doc = null;
    doc={
        addr: null,
        name: name,
        organizers_names: organizers_names,
        beneficiaries_names: beneficiaries_names,
        description: desc,
        rewards_names: rewards_names,
        image_link: image
    }

    var info_hashes = [CryptoJS.MD5(name),CryptoJS.MD5(organizers_names.join(',')),CryptoJS.MD5(beneficiaries_names.join(',')),
                      CryptoJS.MD5(desc),CryptoJS.MD5(rewards_names.join(',')),CryptoJS.MD5(image)]
    info_hashes = info_hashes.join(',').toString()

    App.createCampaign(organizers_list, beneficiaries_list, timestamp_end, rewards_costs, info_hashes,campaignCreatedCallback)
}

function campaignCreatedCallback(address){
    doc.addr = address
    $.ajax({
        type: "POST",  
        data: {campaign:JSON.stringify(doc)},
        url: "http://localhost:3005/new-campaign",
        success: function(data){  
            alert("Campaign created successfully. Address: "+address)
            window.location.href = "campaign.html?addr="+address;
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("Status: " + textStatus); alert("Error: " + errorThrown); 
        }       
    });
}


$(function() {
    $(window).on('load', function () {
        App.init();
    });
});