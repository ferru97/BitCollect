pragma solidity >=0.4.21 <0.7.0;

import "./Campaign.sol";

contract BitCollect{

    address bitcollect_owner;

    address[] campaigns;
    mapping(address => uint) campaign_index;

    uint fraudThreshold;

    event campaignCreated(address cont);

    constructor(uint threshold) public {
        require(threshold>0, "The fraud threshold should be greather than 0");

        bitcollect_owner = msg.sender;
        fraudThreshold = threshold;
    }

    function createCampaign(address[] memory _organizers, address payable[] memory _beneficiaries, uint _end_date,
    uint[] memory rewards_costs, string memory campaign_info_hashes)
    public payable{
        require(_organizers.length>0, "Error: Need at least 1 organizer"); //RQ-PARAMS
        require(_beneficiaries.length>0, "Error: Need at least 1 beneficiarie"); //RQ-PARAMS
        require(_end_date>block.timestamp, "Error: the provided campain end date il is earlier than the start date");

        Campaign new_campaign = new Campaign(_organizers, _beneficiaries, _end_date, rewards_costs, fraudThreshold, campaign_info_hashes);
        campaigns.push(address(new_campaign));
        campaign_index[address(new_campaign)] = campaigns.length-1;

        emit campaignCreated(address(new_campaign));
    }

    function setThreshold(uint t) external{
        require(msg.sender==bitcollect_owner, "only the owner of this BitCollect instance can access this function");
        fraudThreshold = t;
    }

    function getCampaigns() external view returns(address[] memory){
        return campaigns;
    }

}