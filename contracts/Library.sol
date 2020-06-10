pragma solidity >=0.4.21 <0.7.0;

library Library{
    struct reward{
        uint amount;
    }

    struct Donation{
        uint amount;
        address[] donation_beneficiaries;
        uint[] danation_partitions;
    }
}