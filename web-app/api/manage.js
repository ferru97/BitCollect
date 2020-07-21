const express = require('express');
const app = express();
const cors = require('cors');
var bodyParser = require("body-parser");
var Mongo = require('./MongoDB');


app.use(cors({origin: '*'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/api/new-campaign', (req, res) => {
    var data = JSON.parse(req.body.campaign);
    Mongo.addCampaign(data)
    res.end()   

    console.log("New campaign created")
});


app.post('/api/get-campaign', (req, res) => {
    console.log("Get campaign: "+req.body.address)

    var callback = (result)=>{
        res.write(JSON.stringify(result));
        res.end()
      }
    
    Mongo.getCampaign(req.body.address, callback)  
});

app.get('/api/all-campaigns', (req, res) => {
    console.log("Get all campaigns ")

    var callback = (result)=>{
        res.write(JSON.stringify(result));
        res.end()
      }
    Mongo.getAllCampaigns(callback)  
});

app.listen(3005, () => console.log('Gator app listening on port 3005!'));