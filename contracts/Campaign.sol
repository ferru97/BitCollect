pragma solidity >=0.4.21 <0.7.0;

import "./Library.sol";

contract Campaign{

    using Library for Library.Reward;
    using Library for Library.Donation;

    enum State {PENDING, RUNNING, EXPIRED, DEACTIVATED}
    State public state;

    string campaign_name;

    address[] public organizers;
    mapping(address => bool) private organizers_donation;

    address payable[] public beneficiaries;
    mapping(address => Library.Reward) public beneficiaries_map;

    address[] donors;
    mapping(address => Library.Donation[]) private donations;

    uint campaign_end_timestamp;

    event campainStatus(State s);
    event donationSuccess();
    event withdrawSuccess(address beneficiary, uint amount);

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

    constructor(address[] memory _organizers, address payable[] memory _beneficiaries, uint _end_date, string memory name) public {
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

        campaign_end_timestamp = _end_date;

        campaign_name = name;
        state = State.PENDING;
        emit campainStatus(state);
    }

    function startCampaign(address[] calldata to, uint[] calldata wei_partition) campaignNotEnded(block.timestamp) external payable
                                         isOrganizer(msg.sender) beneficiariesExist(to) requireState(State.PENDING){//RQ-PARAMS
        makeDonation(to, wei_partition);

        if(organizers_donation[msg.sender] == false)
            organizers_donation[msg.sender] = true;

        uint organizers_donors = 0;
        for(uint i = 0; i<organizers.length; i++){
            if(organizers_donation[organizers[i]] == true)
                organizers_donors++;
        }

        if(organizers_donors==organizers.length){
            state = State.RUNNING;
            emit campainStatus(state);
        }
        else{
            state = State.PENDING;
            emit campainStatus(state);
        }
    }


    function makeDonation(address[] memory to, uint[] memory wei_partition)public payable campaignNotEnded(block.timestamp)
                        beneficiariesExist(to){
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

        total_donation = 0;
        for(uint i = 0; i<to.length; i++)
            beneficiaries_map[to[i]].amount += wei_partition[i];

        emit donationSuccess();
    }


    function beneficiaryWithdraw() external isBeneficiary(msg.sender) requireState(State.EXPIRED){
        require(state==State.EXPIRED, "Error: the campaign is not ended");
        require(beneficiaries_map[msg.sender].amount > 0, "Error: there have been no donations for this beneficiary");

        uint amount = beneficiaries_map[msg.sender].amount;
        beneficiaries_map[msg.sender].amount = 0;
        (bool success, ) = msg.sender.call.value(amount)("");

        require(success==true, "Error: Withdraw transaction error");

        emit withdrawSuccess(msg.sender,amount);

    }


    function endCampaign() public isOrganizer(msg.sender) {
        require(state==State.RUNNING, "Error: The campaign is not running or is already ended");
        state = State.EXPIRED;
        
        emit campainStatus(state);
    }


    function deactivateCampaign() public isOrganizer(msg.sender) {
        require(state==State.EXPIRED, "Error: The campaign is already ended or is deaactivated");
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
        for(uint i = 0; i<_ben.length; i++){
            rewards[i] = beneficiaries_map[_ben[i]].amount;
        }

        return rewards;
    }


}