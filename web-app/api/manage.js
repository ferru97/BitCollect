const express = require('express');
const app = express();
const cors = require('cors');
var bodyParser = require("body-parser");
var Mongo = require('./MongoDB');


app.use(cors({origin: 'http://localhost:3000'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/new-campaign', (req, res) => {
    var data = JSON.parse(req.body.campaign);
    Mongo.addCampaign(data)
    res.end()   

    console.log("New campaign created")
});

app.listen(3005, () => console.log('Gator app listening on port 3005!'));