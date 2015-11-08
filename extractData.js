var db = require('./database.js'),
    q  = require('q'),
    request = require('request')

var api_key = "c0a31dabbe964f08b492dabf237de9c9"

function crawlSeasonsForYear(){
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
            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}

function getSeasonsForYear(){
    crawlSeasonsForYear().
        then(function(result){
            db.addSeasons(result).
                then(function(){
                    console.log("Added seasons")
                })
        })
}



function crawlTeamsForSeason(id){
    var deferred = q.defer()
    var endpoint = "soccerseasons/"+id+"/teams"

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
            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}

function getTeamsForSeasons(){
    db.getSeasonsWithUncrawledTeams().
        then(function(seasons){    
            console.log(seasons)    
            for(var i=0;i<1;i++){
                crawlTeamsForSeason(seasons[i].id).
                    then(function(result){
                        db.addTeams(result).
                            then(function(season){
                                console.log("Added teams for season: "+season)
                            })
                    })
            }            
    })
}



function crawlTableForSeason(id){
    var deferred = q.defer()
    var endpoint = "soccerseasons/"+id+"/leagueTable"

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
            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}

function getTablesForSeasons(){
    db.getSeasonsWithUncrawledTable().
        then(function(seasons){
            for(var i=0;i<seasons.length;i++){
                crawlTableForSeason(seasons[i].id).
                    then(function(result){
                        db.addTable(result).
                            then(function(season){
                                console.log("Added table for season: "+season)
                            })
                    })
            }
        })
}



function crawlPlayersForTeam(id){
    var deferred = q.defer()
    var endpoint = "teams/"+id+"/players"

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
            deferred.resolve(body)
        }else {
            deferred.reject()
        }
    })

    return deferred.promise
}

function getPlayerForTeams(){
    db.getTeamsWithUncrawledPlayers().
        then(function(teams){
            console.log(teams.length)
            for(var i=0;i<20;i++){
                crawlPlayersForTeam(teams[i].id).
                    then(function(result){
                        db.addPlayers(result).
                            then(function(response){
                                console.log(response)
                            })
                    })
            }
        })
}

getPlayerForTeams()