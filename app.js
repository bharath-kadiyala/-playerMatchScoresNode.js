const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let dataBase = null;
const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DataBase Error: ${error.message}`);
    process.exit(1);
  }
};

const convertSnakeIntoCamel = (eachObj) => {
  return {
    playerId: eachObj.player_id,
    playerName: eachObj.player_name,
    matchId: eachObj.match_id,
    match: eachObj.match,
    year: eachObj.year,
  };
};

initializeDbAndServer();

//1.list of all the players API

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
        *
    FROM 
        player_details`;
  const playersArray = await dataBase.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertSnakeIntoCamel(eachPlayer))
  );
});

//2.specific player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
  SELECT 
    *
  FROM 
    player_details
  WHERE
    player_id = ${playerId}`;
  const getSpePlayer = await dataBase.get(getSpecificPlayerQuery);
  response.send(convertSnakeIntoCamel(getSpePlayer));
});

//3.Updates the details of a specific player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatePlayerDetails = request.body;
  const { playerName } = updatePlayerDetails;
  const updatePlayerQuery = `
  UPDATE 
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId}`;
  await dataBase.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.Return Specific Match API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecMatchQuery = `
    SELECT
        *
    FROM 
        match_details
    WHERE
        match_id = ${matchId}`;
  const getSingleMatch = await dataBase.get(getSpecMatchQuery);
  response.send(convertSnakeIntoCamel(getSingleMatch));
});

//5.list of all the matches of a player API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
  SELECT
    match_id,match,year
  FROM
      player_match_score
      NATURAL JOIN
      match_details
  WHERE
    player_id = ${playerId}`;
  const playerMatchArray = await dataBase.all(playerMatchQuery);
  response.send(
    playerMatchArray.map((eachMatch) => convertSnakeIntoCamel(eachMatch))
  );
});

//6.list of players of a specific match API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerMatchQuery = `
    SELECT 
        player_id,
        player_name 
    FROM 
        match_details
        INNER JOIN 
        player_details
    WHERE 
        match_id = ${matchId}`;
  const getOnlyMatchPlayer = await dataBase.get(playerMatchQuery);
  response.send(convertSnakeIntoCamel(getOnlyMatchPlayer));
});

//7.statistics of the total score API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const staticsQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
    FROM 
        player_details INNER JOIN player_match_score 
    ON
        player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};
    `;
  const getStatics = await dataBase.get(staticsQuery);
  response.send(getStatics);
});

module.exports = app;
