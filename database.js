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
    db.run("CREATE TABLE Seasons(id INTEGER PRIMARY KEY,caption TEXT,league TEXT,year INTEGER,numberOfTeams INTEGER,lastUpdated TEXT,leagueTable INTEGER,FOREIGN KEY (leagueTable) REFERENCES LeagueTables(id));")
    db.run("CREATE TABLE Teams(id INTEGER PRIMARY KEY,name TEXT,code TEXT,shortName TEXT,squadMarketValue TEXT,crestUrl TEXT);")
    db.run("CREATE TABLE Players(id INTEGER PRIMARY Key,name TEXT,position TEXT,jerseyNumber INTEGER,dateOfBirth TEXT,nationality TEXT,contractUntil TEXT,marketValue TEXT);")
    db.run("CREATE TABLE TeamsToPlayers(teamId INTEGER,playerId INTEGER,FOREIGN KEY(teamId) REFERENCES Teams(id), FOREIGN KEY(playerId) REFERENCES Players(id));")
    db.run("CREATE TABLE TeamsToSeasons(seasonId INTEGER,teamId INTEGER,FOREIGN KEY(seasonId) REFERENCES Seasons(id), FOREIGN KEY(teamId) REFERENCES Teams(id));")
    db.run("CREATE TABLE LeagueTables(id INTEGER,leagueCaption TEXT,matchday INTEGER,position INTEGER,teamId INTEGER,playedGames INTEGER,points INTEGER,goals INTEGER,goalsAgainst INTEGER,goalsDifference INTEGER,wins INTEGER,draws INTEGER,losses INTEGER,homeGoals INTEGER,homeGoalsAgainst INTEGER,homeWins INTEGER,homeDraws INTEGER,homeLosses INTEGER,awayGoals INTEGER,awayGoalsAgainst INTEGER,awayWins INTEGER,awayDraws INTEGER,awayLosses INTEGER,FOREIGN KEY(teamId) REFERENCES Teams(id));")
}

exports.addMovie = function(movie){
    var deferred = q.defer()

    db.serialize(function() {

        var stmt = db.prepare("INSERT INTO Movie (id , adult, budget, homepage, imdb_id, original_title, original_language, overview, popularity, production_countries, release_date, revenue, runtime, spoken_languages, status, tagline, title, video, vote_average, vote_count)  VALUES  (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")

        if(movie.adult)
            movie.adult = 1
        else
            movie.adult = 0

        if(movie.video)
            movie.video = 1
        else
            movie.video = 0

        var prodCountries = ""
        for(var i=0; i<movie.production_countries.length ; i++){
            if(i>0)
                prodCountries += ","

            prodCountries += movie.production_countries[i]["iso_3166_1"]
        }

        movie.production_countries = prodCountries

        var spokenLangs = ""
        for(var i=0; i<movie.spoken_languages.length ; i++){
            if(i>0)
                spokenLangs += ","

            spokenLangs += movie.spoken_languages[i]["iso_639_1"]
        }
        movie.spoken_languages = spokenLangs

        stmt.run(movie.id, movie.adult, movie.budget, movie.homepage, movie.imdb_id, movie.original_title, movie.original_language, movie.overview, movie.popularity, movie.production_countries, movie.release_date, movie.revenue, movie.runtime, movie.spoken_languages, movie.status, movie.tagline, movie.title, movie.video, movie.vote_average, movie.vote_count)

        deferred.resolve()
    });

    return deferred.promise

}

exports.getUncrawledMovies = function(){
    var deferred = q.defer()

    db.serialize(function() {
        //var news = []
        db.all("SELECT movieId FROM (SELECT movieId  FROM PlaysInMovie UNION SELECT movieId FROM CrewInMovie) as allMovies WHERE NOT EXISTS (SELECT id as movieId FROM Movie WHERE allMovies.movieId=Movie.id);", function(err, rows) {

            deferred.resolve(rows)

        });


    });

    return deferred.promise
}
