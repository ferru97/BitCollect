

var campaign_address = null
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
    alert(info)
}


