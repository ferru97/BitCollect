pragma solidity >=0.4.21 <0.7.0;

import "./Library.sol";

contract Campaign{

    using Library for Library.Reward;
    using Library for Library.Donation;
    using Library for Library.DonationReward;
    using Library for Library.FraudReporter;


    enum State {PENDING, RUNNING, EXPIRED, DEACTIVATED, BLOCKED}
    State public state;

    address[] public organizers;
    mapping(address => bool) private organizers_donation;
    uint initial_donation_amount;

    address payable[] public beneficiaries;
    mapping(address => Library.Reward) public beneficiaries_map;
    mapping(address => bool) beneficiary_withdrawn;
    uint public total_withdrawn;

    address[] public donors;
    mapping(address => Library.Donation[]) private donations;
    mapping(address => Library.DonationReward[]) private donations_rewards;

    uint[] public rewards_prices;

    uint public thresholdFraud;
    uint public report_investment;
    uint public reports_number;
    mapping(address => bool) fraud_reporters;
    mapping(address => bool) user_refunded;

    uint public campaign_end_timestamp;
    string public info_hashes;

    event campainStatus(State s);
    event donationSuccess();
    event donationRewardUnlocked();
    event withdrawSuccess(uint amount, uint plus);
    event refoundEmitted(uint amount, uint plus);
    event fraudReported(State s);

    modifier isOrganizer() {
        bool is_organizer = false;
        for(uint i = 0; i<organizers.length && !is_organizer; i++){
            if(organizers[i] == msg.sender)
                is_organizer = true;
        }

        require(is_organizer, "Error: function reserved to organizers");
        _;
    }

    modifier isBeneficiary(){
        require(beneficiaries_map[msg.sender].flag==true, "Error: only beneficiaries can access the withdraw");
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

    modifier campaignNotEnded() {
        require(block.timestamp <= campaign_end_timestamp, "Error: campaign deadline expired");
        _;
    }

    modifier campaignExpired(){
        if(block.timestamp > campaign_end_timestamp && state==State.RUNNING)
             state = State.EXPIRED;
        
        require(state == State.EXPIRED, "Error: campaign not yet expired");
        _;
    }

    constructor(address[] memory _organizers, address payable[] memory _beneficiaries, uint _end_date,
    uint[] memory rewards_costs, uint fraudThreshold, string memory campaign_info_hashes, uint _report_investment) public {

        for(uint i = 0; i < _organizers.length; i++) {
            organizers.push(_organizers[i]);
            organizers_donation[_organizers[i]] = false;
        }

        for(uint i = 0; i < _beneficiaries.length; i++){
            beneficiaries.push(_beneficiaries[i]);
            beneficiaries_map[_beneficiaries[i]].amount = 0;
            beneficiaries_map[_beneficiaries[i]].flag = true;
        }

        campaign_end_timestamp = _end_date;
        rewards_prices = rewards_costs;
        info_hashes = campaign_info_hashes;

        state = State.PENDING;

        thresholdFraud = fraudThreshold;
        report_investment = _report_investment;
        initial_donation_amount = 0;

        emit campainStatus(state);
    }

    function startCampaign(address[] calldata to, uint[] calldata wei_partition, string calldata contact_email)
     campaignNotEnded() external payable isOrganizer() beneficiariesExist(to) requireState(State.PENDING){//RQ-PARAMS
        
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
     campaignNotEnded() beneficiariesExist(to){
         
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
            while(i<rewards_prices.length && msg.value>=rewards_prices[i])
                i++;

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


    function beneficiaryWithdraw() external isBeneficiary() campaignExpired(){
        require(beneficiary_withdrawn[msg.sender]==false, "Error: already withdrawn");//Avoid reentrancy

        uint amount = beneficiaries_map[msg.sender].amount;

        //Subdivide ether from reporters(if exist) to all beneficiaries
        uint plus = 0;
        if (reports_number > 0)
            plus = uint((reports_number*report_investment)/beneficiaries.length);

        beneficiary_withdrawn[msg.sender] = true; //consider beneficiary withdrawn before send ether to avoid reentrancy
        total_withdrawn += 1;

        uint total = amount+plus;
        if(total > 0){
            (bool success, ) = msg.sender.call.value(total)("");
            require(success==true, "Error: Withdraw transaction error");
        }
        
        emit withdrawSuccess(amount, plus);

    }


    function deactivateCampaign() public isOrganizer() requireState(State.EXPIRED){
        require(address(this).balance==0, "Error: Wait until all beneficiaries withdraw their reward");
        state = State.DEACTIVATED;

        emit campainStatus(state);
    }


    function getDonationReward() external view returns(uint[] memory){
        Library.DonationReward[] memory user_donations_rewards = donations_rewards[msg.sender];
        uint[] memory rewards = new uint[](user_donations_rewards.length);

        for(uint i = 0; i<user_donations_rewards.length; i++)
            rewards[i] = user_donations_rewards[i].max_reward_index;

        return rewards;
    }

    function reportFraud() external payable requireState(State.RUNNING){
        require(fraud_reporters[msg.sender]==false, "Error: You have already reported this campaign");
        require(msg.value==report_investment, "Error: You need to invest some ether to report a fraud");

        fraud_reporters[msg.sender] = true;

        reports_number += 1;
        if(reports_number == thresholdFraud)
            state = State.BLOCKED;

        emit fraudReported(state);
    }


    function fraudWithdraw() external payable requireState(State.BLOCKED){
        require(user_refunded[msg.sender]==false, "You have already been refunded");

        uint index = 0;
        if (organizers_donation[msg.sender]==true) //If organizer do not consider the firt donation sice it is the inital
            index = 1;

        require(donations[msg.sender].length>=index || fraud_reporters[msg.sender]==true,
        "You have not made donations/report or you have already withdrawn");

        uint amount = 0;
        Library.Donation[] memory user_donation = donations[msg.sender];
        while(index < user_donation.length){
            amount += user_donation[index].amount;
            index++;
        }

        uint plus = 0;
        if(fraud_reporters[msg.sender]==true)//If the sender is a reporter
            plus = uint(initial_donation_amount / reports_number) + report_investment;


        user_refunded[msg.sender] = true; //to avoid reentrancy
        (bool success, ) = msg.sender.call.value(amount+plus)("");
        require(success==true, "Error: Fraud refound transaction error");

        emit refoundEmitted(amount, plus);

    }


    //Dapp get information
    function getAllBeneficiaries() public view returns(address payable[] memory){return beneficiaries;}

    function getAllOrganizers() public view returns(address[] memory){return organizers;}

    function organizerHaveDonated()public view isOrganizer() returns(bool) {return organizers_donation[msg.sender];}

    function getAllRewardsPrices() public view returns(uint[] memory){return rewards_prices;}

    function getBeneficiaryReward(address b)public view returns(uint){return beneficiaries_map[b].amount;}

    function beneficiaryHaveWithdrawn()public view isBeneficiary() returns(bool){return beneficiary_withdrawn[msg.sender];}

    function userHaveReported()public view returns(bool){return fraud_reporters[msg.sender];}

    function userHaveBeenRefunded()public view returns(bool){return user_refunded[msg.sender];}

    function getUserDonation()public view returns(uint[] memory){
        Library.Donation[] memory user_donations = donations[msg.sender];
        uint[] memory donations_amounts = new uint[](user_donations.length);

        for(uint i = 0; i<donations_amounts.length; i++)
            donations_amounts[i] = user_donations[i].amount;
        
        return donations_amounts;
    }

    function getUserRewards()public view returns(uint[] memory){
        Library.DonationReward[] memory user_rewards = donations_rewards[msg.sender];
        uint[] memory rewards = new uint[](user_rewards.length);

        for(uint i = 0; i<rewards.length; i++)
            rewards[i] = user_rewards[i].max_reward_index;
            
        return rewards;
    }


}