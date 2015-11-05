var db = require('./database.js'),
    q  = require('q'),
    request = require('request')

var api_key = "c0a31dabbe964f08b492dabf237de9c9"

function getSeasonsForYear(){
    var deferred = q.defer()
    var endpoint = "soccerseasons/"

    var parameters = {
        url: "http://api.football-data.org/alpha/" + endpoint,
        headers: {
            'Accept': 'application/json',
            'X-Auth-Token': api_key
        },
        json: true,
        gzip: true,
        type: "GET"
    }

    request(parameters, function (error, response, body) {
        if(body){
            //if(body.status && (body.status != 200 || body.status == 403)){
            //    deferred.reject({
            //        id: id,
            //        error: "Movie API call " + body.message
            //    })
            //    return
            //}

            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}


getSeasonsForYear().
    then(function(result){
        console.log(result)
    })