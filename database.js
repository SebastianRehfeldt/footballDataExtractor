var fs = require("fs");
var file = "data.db";
var exists = fs.existsSync(file);
var q = require("q")

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
    if(!exists) {
        setUpDatabase()
    }
});

function setUpDatabase(){
    db.run("CREATE TABLE Seasons(id INTEGER PRIMARY KEY,caption TEXT,league TEXT,year INTEGER,numberOfTeams INTEGER,numberOfGames INTEGER,lastUpdated TEXT,leagueTable INTEGER,FOREIGN KEY (leagueTable) REFERENCES LeagueTables(id));")
    db.run("CREATE TABLE Teams(id INTEGER PRIMARY KEY,name TEXT,code TEXT,shortName TEXT,squadMarketValue TEXT,crestUrl TEXT);")
    db.run("CREATE TABLE Players(id INTEGER PRIMARY Key,name TEXT,position TEXT,jerseyNumber INTEGER,dateOfBirth TEXT,nationality TEXT,contractUntil TEXT,marketValue TEXT);")
    db.run("CREATE TABLE TeamsToPlayers(teamId INTEGER,playerId INTEGER,FOREIGN KEY(teamId) REFERENCES Teams(id), FOREIGN KEY(playerId) REFERENCES Players(id));")
    db.run("CREATE TABLE TeamsToSeasons(seasonId INTEGER,teamId INTEGER,FOREIGN KEY(seasonId) REFERENCES Seasons(id), FOREIGN KEY(teamId) REFERENCES Teams(id));")
    db.run("CREATE TABLE LeagueTables(id INTEGER,leagueCaption TEXT,matchday INTEGER,position INTEGER,teamId INTEGER,playedGames INTEGER,points INTEGER,goals INTEGER,goalsAgainst INTEGER,goalsDifference INTEGER,wins INTEGER,draws INTEGER,losses INTEGER,homeGoals INTEGER,homeGoalsAgainst INTEGER,homeWins INTEGER,homeDraws INTEGER,homeLosses INTEGER,awayGoals INTEGER,awayGoalsAgainst INTEGER,awayWins INTEGER,awayDraws INTEGER,awayLosses INTEGER,FOREIGN KEY(teamId) REFERENCES Teams(id));")
}

exports.addSeasons = function(seasons){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO Seasons (id , caption, league, year, numberOfTeams, numberOfGames, lastUpdated, leagueTable)  VALUES  (?,?,?,?,?,?,?,?)")

        for(var i=0;i<seasons.length;i++){
            var link = seasons[i]["_links"].self.href
            var id = link.substring(link.lastIndexOf("/")+1,link.length)

            stmt.run(id, seasons[i].caption, seasons[i].league, seasons[i].year, seasons[i].numberOfTeams, seasons[i].numberOfGames, seasons[i].lastUpdated, id)
        }     

        deferred.resolve()
    });

    return deferred.promise
}

exports.getSeasonsWithUncrawledTeams = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //teams which play in CL are already added in their home country seasons
        db.all("SELECT id FROM Seasons WHERE id NOT IN (SELECT id FROM TeamsToSeasons) AND league<>'CL';", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}
exports.addTeams = function(teams){
    var deferred = q.defer()

    db.serialize(function() {

        var stmtTeams = db.prepare("INSERT INTO Teams (id , name, code, shortName, squadMarketValue, crestUrl)  VALUES  (?,?,?,?,?,?)")
        var stmtTeamsToSeasons = db.prepare("INSERT INTO TeamsToSeasons (seasonId, teamId)  VALUES  (?,?)")

        var seasonLink = teams["_links"][1].soccerseason
        var seasonId = seasonLink.substring(seasonLink.lastIndexOf("/")+1,seasonLink.length)

        for(var i=0;i<teams.count;i++){
            var team = teams.teams[i]
            var teamLink = team["_links"].self.href
            var teamId = teamLink.substring(teamLink.lastIndexOf("/")+1,teamLink.length)

            stmtTeams.run(teamId,team.name,team.code,team.shortName,team.squadMarketValue,team.crestUrl)
            stmtTeamsToSeasons.run(seasonId, teamId)
        }     

        deferred.resolve(seasonId)
    });

    return deferred.promise
}



exports.getSeasonsWithUncrawledTable = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //there is no table for champions league
        db.all("SELECT id FROM Seasons WHERE id NOT IN (SELECT id FROM LeagueTables) AND league<>'CL';", function(err, rows) { 

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}
exports.addTable = function(table){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO LeagueTables (id, leagueCaption,matchday,position,teamId,playedGames,points,goals,goalsAgainst,goalsDifference,wins,draws,losses,homeGoals,homeGoalsAgainst,homeWins,homeDraws,homeLosses,awayGoals,awayGoalsAgainst,awayWins,awayDraws,awayLosses)  VALUES  (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
        
        var seasonLink = table["_links"].soccerseason
        var seasonId = seasonLink.substring(seasonLink.lastIndexOf("/")+1,seasonLink.length)

        var leagueCaption = table.leagueCaption
        var matchday = table.matchday

        for(var i=0;i<table.standing.length;i++){
            var standing = table.standing[i]
            
            var teamLink = standing["_links"].team.href
            var teamId = teamLink.substring(teamLink.lastIndexOf("/")+1,teamLink.length)

            stmt.run(seasonId,leagueCaption,matchday,standing.position,teamId,standing.playedGames,standing.points,standing.goals,standing.goalsAgainst,standing.goalDifference,standing.wins,standing.draws,standing.losses,standing.home.goals,standing.home.goalsAgainst,standing.home.wins,standing.home.draws,standing.home.losses,standing.away.goals,standing.away.goalsAgainst,standing.away.wins,standing.away.draws,standing.away.losses)
        }     

        deferred.resolve(seasonId)
    });

    return deferred.promise
}




exports.getTeamsWithUncrawledPlayers = function(){
    var deferred = q.defer()

    db.serialize(function() {
        db.all("SELECT id FROM Teams WHERE id NOT IN (SELECT teamId FROM TeamsToPlayers);", function(err, rows) {
            deferred.resolve(rows)
        });
    });

    return deferred.promise
}
exports.addPlayers = function(players){
    var deferred = q.defer()

    db.serialize(function() {

        var stmtPlayers = db.prepare("INSERT INTO Players (id, name, position, jerseyNumber, dateOfBirth, nationality, contractUntil, marketValue)  VALUES  (?,?,?,?,?,?,?,?)")
        var stmtTeamsToPlayers = db.prepare("INSERT INTO TeamsToPlayers (teamId,playerId) VALUES (?,?)")

        var teamLink = players["_links"].team.href
        var teamId = teamLink.substring(teamLink.lastIndexOf("/")+1,teamLink.length)

        if(players.count==0){
            stmtTeamsToPlayers.run(teamId,-1)
            deferred.resolve("No players for team:"+teamId)
        }
        else{
            for(var i=0;i<players.count;i++){
                var player=players.players[i]
                stmtPlayers.run(player.id,player.name,player.position,player.jerseyNumber,player.dateOfBirth,player.nationality,player.contractUntil,player.marketValue)
                stmtTeamsToPlayers.run(teamId,player.id)
            }
            deferred.resolve("Added Players for team: "+teamId)
        }
    });

    return deferred.promise
}