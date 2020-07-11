pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import "./Library.sol";

contract Campaign{

    using Library for Library.Reward;
    using Library for Library.Donation;
    using Library for Library.DonationReward;
    using Library for Library.FraudReporter;


    enum State {PENDING, RUNNING, EXPIRED, DEACTIVATED, BLOCKED}
    State public state;

    string campaign_name;
    string campaign_description;
    string campaign_image;
    string campaign_image_hash;

    address[] public organizers;
    mapping(address => bool) private organizers_donation;
    uint initial_donation_amount;

    string beneficiaries_names;
    address payable[] public beneficiaries;
    mapping(address => Library.Reward) public beneficiaries_map;

    address[] donors;
    mapping(address => Library.Donation[]) private donations;
    mapping(address => Library.DonationReward[]) private donations_rewards;

    string[] donation_rewards;
    uint[] rewards_prices;

    uint thresholdFraud;
    uint fraud_report_amount;
    address[] fraud_reporters;
    mapping(address => uint) reports_investments;

    uint campaign_end_timestamp;

    event campainStatus(State s);
    event donationSuccess();
    event donationRewardUnlocked();
    event withdrawSuccess(address beneficiary, uint amount);
    event refoundEmitted(uint amount, uint plus);
    event fraudReported(State s);

    modifier isOrganizer(address expected) {
        bool is_organizer = false;
        for(uint i = 0; i<organizers.length && !is_organizer; i++){
            if(organizers[i] == expected)
                is_organizer = true;
        }

        require(is_organizer, "Error: function reserved to organizers");
        _;
    }

    modifier isBeneficiary(address b){
        require(beneficiaries_map[b].flag==true, "Error: only beneficiaries can access the withdraw");
        _;
    }

    modifier requireState(State s){
        require(s==state, "Error: cannot access this functionality from the current state");
        _;
    }

    modifier beneficiariesExist(address[] memory b) {
        bool error = false;
        for(uint i = 0; i<beneficiaries.length && !error; i++){
            if(beneficiaries_map[beneficiaries[i]].flag == false)
                error = true;
        }

        require(error==false, "Error: one or more of the provided beneficiaries do not exist");
        _;
    }

    modifier campaignNotEnded(uint current_timestamp) {
        require(current_timestamp < campaign_end_timestamp, "Error: campaign deadline expired");
        _;
    }

    constructor(address[] memory _organizers, address payable[] memory _beneficiaries, string memory _beneficiaries_names, uint _end_date,
    string memory name, string memory _description, string[] memory rewards_names, uint[] memory rewards_costs, uint fraudThreshold, string memory imgage_url, string memory image_hash) public {

        uint l = _organizers.length;
        for(uint i = 0; i < l; i++) {
            organizers.push(_organizers[i]);
            organizers_donation[_organizers[i]] = false;
        }

        l = _beneficiaries.length;
        for(uint i = 0; i < l; i++) {
            beneficiaries.push(_beneficiaries[i]);
            beneficiaries_map[_beneficiaries[i]].amount = 0;
            beneficiaries_map[_beneficiaries[i]].flag = true;
        }

        beneficiaries_names = _beneficiaries_names;
        campaign_end_timestamp = _end_date;


        campaign_name = name;
        campaign_description = _description;
        state = State.PENDING;

        donation_rewards = rewards_names;
        rewards_prices = rewards_costs;

        thresholdFraud = fraudThreshold;
        fraud_report_amount = 0;
        initial_donation_amount = 0;

        campaign_image = imgage_url;
        campaign_image_hash = image_hash;
        emit campainStatus(state);
    }

    function startCampaign(address[] calldata to, uint[] calldata wei_partition, string calldata contact_email)
     campaignNotEnded(block.timestamp) external payable isOrganizer(msg.sender) beneficiariesExist(to) requireState(State.PENDING){//RQ-PARAMS 
        
        makeDonation(to, wei_partition, contact_email);

        if(organizers_donation[msg.sender] == false)
            organizers_donation[msg.sender] = true;

        uint organizers_donors = 0;
        for(uint i = 0; i<organizers.length; i++){
            if(organizers_donation[organizers[i]] == true)
                organizers_donors++;
        }

        initial_donation_amount += msg.value;

        if(organizers_donors==organizers.length)
            state = State.RUNNING;
        else
            state = State.PENDING;

        emit campainStatus(state);
    }


    function makeDonation(address[] memory to, uint[] memory wei_partition, string memory contact_email)public payable
     campaignNotEnded(block.timestamp)beneficiariesExist(to){
         
        require(state==State.RUNNING || (state==State.PENDING && organizers_donation[msg.sender]==false),
                "Error: The campaign is not started or you're not an organizer to start it");
        require(msg.value>0, "Error: 0 wei provided");
        require(to.length==wei_partition.length, "Error: destinators size is different from the wei's partition size");
        
        uint total_donation = 0;
        for(uint i = 0; i<wei_partition.length; i++){
            total_donation += wei_partition[i];
        }
        require(msg.value==total_donation,"Error: Total povided weis are different from the provided weis partitions");
        

        Library.Donation memory d;

        d.amount = msg.value;
        d.donation_beneficiaries = to;
        d.danation_partitions = wei_partition;
        donations[msg.sender].push(d);

        //Check for rewards
        if(rewards_prices.length>0 && msg.value>=rewards_prices[0]){
            Library.DonationReward memory reward;
            uint i = 0;
            while(i<donation_rewards.length && msg.value>=rewards_prices[i]){
                i++;
            }

            reward.max_reward_index = i - 1;
            reward.donation_index = donations[msg.sender].length - 1;
            reward.email_contact = contact_email;

            donations_rewards[msg.sender].push(reward);

            emit donationRewardUnlocked();
        }

        for(uint i = 0; i<to.length; i++)
            beneficiaries_map[to[i]].amount += wei_partition[i];

        emit donationSuccess();
    }


    function beneficiaryWithdraw() external isBeneficiary(msg.sender) requireState(State.EXPIRED){
        require(beneficiaries_map[msg.sender].amount > 0, "Error: there have been no donations for this beneficiary");

        uint amount = beneficiaries_map[msg.sender].amount;
        beneficiaries_map[msg.sender].amount = 0;
        (bool success, ) = msg.sender.call.value(amount)("");

        require(success==true, "Error: Withdraw transaction error");

        emit withdrawSuccess(msg.sender,amount);

    }


    function endCampaign() public isOrganizer(msg.sender) requireState(State.RUNNING){
        state = State.EXPIRED;

        //Subdivide ether from reporter to all beneficiaries
        if (fraud_report_amount > 0){
            uint plus = uint(fraud_report_amount/beneficiaries.length);
            for(uint i = 0; i<beneficiaries.length; i++)
                beneficiaries_map[beneficiaries[i]].amount += plus;
        }

        emit campainStatus(state);
    }


    function deactivateCampaign() public isOrganizer(msg.sender) requireState(State.EXPIRED){
        require(address(this).balance==0, "Error: Wait until all beneficiaries withdraw their reward");
        state = State.DEACTIVATED;

        emit campainStatus(state);
    }


    function getBeneficiaries() public view returns(address payable[] memory){
        return beneficiaries;
    }

    function getDeadline() public view returns(uint){
        return campaign_end_timestamp;
    }

    function getBeneficiariesRewards(address[] memory _ben) public view beneficiariesExist(_ben) returns(uint[] memory){
        uint[] memory rewards = new uint[](_ben.length);
        for(uint i = 0; i<_ben.length; i++)
            rewards[i] = beneficiaries_map[_ben[i]].amount;

        return rewards;
    }


    function getDonationReward() external view returns(string memory){
        string memory rewards = "";
        string memory delimeter = "@";
        Library.DonationReward[] memory user_donations_rewards = donations_rewards[msg.sender];

        for(uint i = 0; i<user_donations_rewards.length; i++){
           for(uint k = 0; k<=user_donations_rewards[i].max_reward_index; k++){
                rewards = strConcat(rewards, delimeter, donation_rewards[k]);
           }
        }

        return rewards;
    }

    function reportFraud() external payable requireState(State.RUNNING){
        require(reports_investments[msg.sender]==0, "Error: You have already reported this campaign");
        require(msg.value>0, "Error: You need to invest some ether to report a fraud");

        reports_investments[msg.sender] = msg.value;
        fraud_reporters.push(msg.sender);

        fraud_report_amount += msg.value;

        if(fraud_reporters.length >= thresholdFraud)
            state = State.BLOCKED;

        emit fraudReported(state);
    }


    function fraudWithdraw() external payable requireState(State.BLOCKED){
        uint index;
        if (organizers_donation[msg.sender]==true) //If organizer do not consider the firt donation sice it is the inital
            index = 1;
        else
            index = 0;

        require(donations[msg.sender].length>index || reports_investments[msg.sender]>0,
        "You have not made donations/report or you have already withdrawn");

        uint amount = 0;
        Library.Donation[] memory user_donation = donations[msg.sender];
        while(index < user_donation.length){
            amount += user_donation[index].amount;
            index++;
        }

        delete donations[msg.sender]; //remove all donation before refounding to avoid reentrancy

        uint plus = 0;
        if(reports_investments[msg.sender]>0){//If the sender is a reporter
            plus = uint(initial_donation_amount/fraud_reporters.length);
            reports_investments[msg.sender] = 0;  //remove reporter investment to avoid reentrancy
        }

        (bool success, ) = msg.sender.call.value(amount+plus)("");
        require(success==true, "Error: Fraud refound transaction error");

        emit refoundEmitted(amount, plus);

    }

    function strConcat(string memory a, string memory b, string memory c) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c));
    }


}