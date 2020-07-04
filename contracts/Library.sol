pragma solidity >=0.4.21 <0.7.0;

library Library{

    struct Reward{
        uint amount;
        bool flag;
    }

    struct DonationReward{
        uint max_reward_index;
        uint donation_index;
        string email_contact;
    }

    struct Donation{
        uint amount;
        address[] donation_beneficiaries;
        uint[] danation_partitions;
        DonationReward reward;
        bool flag;
    }

}