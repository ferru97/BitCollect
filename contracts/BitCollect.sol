pragma solidity >=0.4.21 <0.7.0;

import "./Campaign.sol";

contract BitCollect{

    address bitcollect_owner;

    address[] campaigns;
    mapping(address => uint) campaign_index;

    uint fraudThreshold;
    uint report_investment;

    event campaignCreated(address cont);

    modifier isOwner() {
        require(msg.sender==bitcollect_owner, "Only the owner of this BitCollect instance can access this function");
        _;
    }

    constructor(uint fraud_threshold, uint _report_investment) public {
        require(fraud_threshold>0, "The fraud threshold should be greater  than 0");
        require(_report_investment>0, "The required ether for fraud report should be greater  than 0");

        bitcollect_owner = msg.sender;
        fraudThreshold = fraud_threshold;
        report_investment = _report_investment;
    }

    function createCampaign(address[] memory _organizers, address payable[] memory _beneficiaries, uint _end_date,
    uint[] memory rewards_costs, string memory campaign_info_hashes)
    public payable{

        Campaign new_campaign = new Campaign(_organizers, _beneficiaries, _end_date, rewards_costs, fraudThreshold, campaign_info_hashes, report_investment);
        campaigns.push(address(new_campaign));
        campaign_index[address(new_campaign)] = campaigns.length-1;

        emit campaignCreated(address(new_campaign));
    }

    function setFraudThreshold(uint t) isOwner() external{
        require(t>0, "The fraud threshold should be greater  than 0");
        fraudThreshold = t;
    }

    function setFraudInvestment(uint t) isOwner() external{
        require(t>0, "The required ether for fraud report should be greater  than 0");
        report_investment = t;
    }


}