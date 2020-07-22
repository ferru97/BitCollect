# BitCollect

BitCollect is a decentralized crowdfunding platform that works on the Ethereum blockchain. The system guarantees all the benefits of a blockchain application, i.e. tamper-proof, transparency and cheapness

## System Architecture
The system is formed by the
- **Smart contracts** implementing the logic of the system, located in the *contracts/* folder
- **Web App** an interface to the blockchain using *Web3.js* that expose to the user all the supported functionalities. Located in the *web-app/* folder

![system architecture](https://i.ibb.co/K2RZPW9/sys.png)

## Requirements
The system requirements are the following:
- **NodeJs** runtime environment
- **MongoDB** database with a collection named bitcollect containing a  document named campaigns
- **Ganache** personal Ethereum blockchain


## How to use
In order to locally set-up and test the system, you have to follow the following step:
1.	Go in the project folder and install all the dependencies with **npm install**
2.	Open a first terminal instance and run the HTTP server with **npm run dev**
3.	Open a second terminal instance and run  ExpressJS API manager with **npm run dev-api**
4.	Deploy the BitCollect contract to the Ganache blockchain with **truffle migrate**


