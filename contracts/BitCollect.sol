pragma solidity >=0.4.21 <0.7.0;

import "./Library.sol";

contract BitCollect{

    using Library for Library.reward;
    using Library for Library.Donation;

    address payable[] organizers;
    mapping(address => bool) public organizers_map;

    address payable[] beneficiaries;
    mapping(address => Library.reward) public beneficiaries_map;

    mapping(address => Library.Donation[]) private donors;

    constructor() public {
    
    }

}