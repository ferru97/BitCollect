const MongoClient = require('mongodb').MongoClient
Server = require('mongodb').Server

var db_address = "localhost"
var db_port = 27017

mongoclient = new MongoClient(new Server(db_address, db_port), {native_parser: true});
mongoclient.connect();

var db =  mongoclient.db('bitcollect')
var campaigns =  db.collection('campaigns')


function addCampaign(campaign){
    var doc={
        addr: campaign.addr,
        name: campaign.name,
        organizers_names: campaign.organizers_names,
        bneficiaries_names: campaign.beneficiaries_names,
        description: campaign.description,
        rewards_name: campaign.rewards_names,
        image_link: campaign.image_link
    }
    campaigns.insertOne(doc)
}


module.exports = {
    addCampaign: addCampaign,
}