pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./Campaign.sol";

contract BitCollect{

    Campaign[] campaigns;
    mapping(address => uint) campaign_index;
    mapping(uint => uint) test;

    event campaignCreated(address cont);

    constructor() public {}

    function createCampaign(address[] memory _organizers, address payable[] memory _beneficiaries, uint _end_date, string memory name,
     string[] memory rewards_names, uint[] memory rewards_costs)
    public payable{
        require(_organizers.length>0, "Error: Need at least 1 organizer"); //RQ-PARAMS
        require(_beneficiaries.length>0, "Error: Need at least 1 beneficiarie"); //RQ-PARAMS
        require(_end_date>block.timestamp, "Error: the provided campain end date il is earlier than the start date");
        require(rewards_names.length==rewards_costs.length, "Error: rewards and rewards prices should have the same cardinality");

        Campaign new_campaign = new Campaign(_organizers, _beneficiaries, _end_date, name, rewards_names, rewards_costs);
        campaigns.push(new_campaign);
        campaign_index[address(new_campaign)] = campaigns.length-1;

        emit campaignCreated(address(new_campaign));
    }

}