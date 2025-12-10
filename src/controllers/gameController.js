import { AppError } from "../errors/AppError.js";
import { matchedData } from "express-validator";
import * as gameSetup from "../db/gameSetup.js";
const {
  getScene: dbGetScene,
  getAllScenes: dbGetAllScenes,
  getSession,
  getGame: dbGetGame,
  getGameByScene,
  getSceneCharacters,
  addGame,
  getGameScene,
  getCharacterKey,
  getAnswer,
  getSceneAnswerCount,
  setGameAnswer,
  getGameAnswerCount,
  endGame,
  inTopTen,
  getTopTen: dbGetTopTen,
  setUsername: dbSetUsername,
  getGameElapsedTime,
} = gameSetup;

/**
 * this method is sets up a new game only if the session doesn't have a gameId value already
 * it sets up the game with the first scene if the params.id is not provided, 
 * username of 'anonymous' and the start time is set in epoch time 
 *
 * Later on, the game row will be updated whenever the user finds new characters and completes the game (end time will be recorded plus name if given)
 *
 * @param {*} sid the session id retrieved from the cookie
 */
export async function setupGame(req, res, next) {
  const sid = req.session.id;
  const sceneId = req.params.id;

  console.log("in setupGame: ", sid, sceneId);

  if (!req.session.gameIds || !req.session.gameIds[sceneId]) {
    // insert a new game into the game table and update the session with the new game id
    console.log("make a new game");
    try {
      const scene = await dbGetScene(sceneId); //gets the first scene if sceneId is not provided
      if (scene) {
        const game = await addGame(scene.id);
        if (game) {
          console.log("game.id: ", game.id);
          req.session.gameIds ? req.session.gameIds[scene.id] = game.id 
            : req.session.gameIds = { [scene.id]: game.id };
        } else {
          throw new AppError("Failed to setup a new game");
        }
      } else {
        throw new AppError("Failed to get a scene to setup the game with");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  next();
}

/*
export async function getGameIDs(sid) {
  console.log("in getGameIDs: ", sid);
  try {
    const sData = await getSessionData(sid);
    console.log("retrieved the parsed data: ", sData);
    if (sData) {
      return sData.cookie?.gameIds;
    }
  } catch (error) {
    console.error(error);
    throw new AppError("Failed to get the session data");
  }
  
}*/

export async function getSessionData(sid) {
  console.log("in getSessionData: ", sid);
  try {
    const session = await getSession(sid);
    let sData = null;
    if (session) {
      console.log("retrieved the session: ", session);
      sData = await JSON.parse(session.data);
      console.log("session data: ", sData);
    }
    return sData;
  } catch (error) {
    console.error(error);
    throw new AppError(`Failed to get the session for ${sid}`);
  }
}

export async function getAllScenes(req, res) {
  try {
    const scenes = await dbGetAllScenes();
    if (scenes) {
      console.log("scenes: ", scenes)
      res.status(200).json({scenes})
    }
  } catch (error) {
    console.error(error);
    throw new AppError("Failed to retrieve a list of all scenes")
  }
}
export async function getScene(req, res) {
  try {
    const scene = await dbGetScene(req.params.id);
    if (scene) {
      res.status(200).json({
        id: scene.id,
        url: scene.url,
      });
    } else {
      throw new AppError("Failed to find a scene");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getCharacters(req, res) {
  try {
    const { id } = matchedData(req);
    const characters = await getSceneCharacters(id);
    if (characters) {
      console.log(characters);
      res.status(200).json({
        message: "success",
        characters: characters.reduce((acc, el) => {
          acc.push({ name: el["character_name"].name, url: el["character_name"]["icon_url"] });
          return acc;
        }, []),
      });
    } else {
      throw new AppError("Failed to get the scene characters");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getGameAnswers(req, res) {
  console.log("in getGameAnswers: ", req.session.id, req.params.id)
  const sceneId = req.params.id;
  try {
    // extract the game_id from the session row
    let gameId = req.session.gameIds[sceneId];
    if (gameId) {
      console.log("found a game id: ", gameId);
      const game = await dbGetGame(gameId);

      // game.gameAnswers: [ { location_x: 0.07, location_y: 24.82, character_name:{name: 'ODLAW'} } ]
      const answers = game.gameAnswers.map(el => ({ x: el.location_x, y: el.location_y, name: el["character_name"].name}))
      return res.status(200).json({ message: "success", gameAnswers: answers });
      
    } else {
      throw new AppError(
        `failed to get a game id from the current session: ${req.session.id}`
      );
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// returns all the details of the game that is in the session 
// if there is more than one there, just defaults to the first one in the list
export async function getGame(req, res) {
  console.log("in getGame: ", req.session.id, req.params.id);

  try {
    // extract the game_id from the session row
    let gameId = req.session.gameIds[req.params.id];
    if (gameId) {
      console.log("found a game id: ", gameId);
      const game = await dbGetGame(gameId);
      // game.gameAnswers: [ { location_x: 0.07, location_y: 24.82, character: 'ODLAW' } ]
      // do a little data massaging
      // - turn the start time stamp into an epoch timestamp
      // - reorganize the return values so the db schema is not obvious and for the client's convenience
      if (game) {
        console.log("getGame game: ", game);
        console.log("start_time from the db: ", game.start_time);
        game.start_time = new Date(game.start_time).valueOf();
        console.log("start_time as epoch value: ", game.start_time);
        console.log(
          "found character names: ",
          game.gameAnswers.length > 0
            ? game.gameAnswers[0].character_name
            : game.gameAnswers
        );
        game.scene.characters = game.scene.answers.reduce((acc, el) => {
          const characterName = el["character_name"].name;
          if (
            game.gameAnswers.length > 0
              ? !checkGameAnswers(game.gameAnswers, characterName)
              : true
          ) {
            acc.push(characterName);
          }
          return acc;
        }, []);
        delete game.scene.answers;
        return res.status(200).json({ message: "success", game });
      }
    } else {
      throw new AppError(
        `failed to get a game id from the current session: ${req.session.id} where gameIds is ${req.session.gameIds}`
      );
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function evaluateAnswer(req, res) {
  console.log("in evaluateAnswer: ", req.query, req.params.id);
  const x = req.query.x;
  const y = req.query.y;
  const characterName = req.query.character;

  const sid = req.session.id;
  const gameId = req.session.gameIds[req.params.id];

  try {
    const sceneId = req.params.id; //await getGameScene(gameId);
    const characterKey = await getCharacterKey(characterName);
    const answerRow = await getAnswer(sceneId, characterKey.character);
    if (answerRow) {
      if (
        inRange(answerRow.location_x, x, .7) &&
        inRange(answerRow.location_y, y, 1.14)
      ) {
        // log the answer in the game_answer table and get the count of all answers found
        const gameAnswer = await setGameAnswer(
          gameId,
          characterKey.character,
          x,
          y
        );
        let [gameAnswerCount, expectedAnswerCount] = await Promise.all([
          getGameAnswerCount(gameId),
          getSceneAnswerCount(sceneId),
        ]);
        console.log(
          "this game's answer count: ",
          gameAnswerCount,
          expectedAnswerCount
        );
        const resultObj = {
          message: "Correct answer",
          x,
          y,
          character: characterName,
        };
        // if all answers found, then record the current end_time in the game table
        if (gameAnswerCount === expectedAnswerCount) {
          // record the end time in the game table
          const updatedGame = await endGame(gameId);

          // calculate the elapsed time
          const elapsed_time = calculateElapsedTime(
            updatedGame.start_time,
            updatedGame.end_time
          );
          console.log("elapsed time: ", elapsed_time);

          // send back the elapsed time 
          resultObj["elapsed_time"] = elapsed_time;

          // find the top ten and see if the current game is in the top?
          const topTen = await inTopTen(req.params.id, gameId);
          console.log("player is in the top ten: ", topTen.length)
          if (topTen.length > 0) {
            // send back the key topten: true if the score is in the highest ten scores
            resultObj.inTopTen = true;
          } else {
            resultObj.inTopTen = false;
          }
        }
        res.status(201).json(resultObj);
      } else {
        res
          .status(200)
          .json({ message: "Wrong answer", x, y, character: characterName });
      }
    } else {
      res
        .status(200)
        .json({ message: "Wrong answer", x, y, character: characterName });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const checkSessionGameExists = async (req, res) => {
  if (req.session.gameIds) {
    const gameId = req.session.gameIds[req.params.id];
    if (gameId) {
      res.status(200).json({ message: "true" });
    } else {
      res.status(200).json({ message: "false" });
    }
  } else {
    res.status(200).json({ message: "false"})
  }
};

// returns the top ten and the current game id and the elapsed_time for that id
export async function getTopTen(req, res) {
  const sceneId = req.params.id;
  try {
    const topTen = await dbGetTopTen(sceneId);
    if (topTen) {
      console.log(topTen);
      let gameTime = null;
      if (req.session.gameIds && req.session.gameIds[sceneId]) {
        gameTime = await getGameElapsedTime(req.session.gameIds[sceneId]);
      } else {
        gameTime = [{ elapsed_time: null }];
      }
      if (gameTime) {
        
        const gameId = req.session.gameIds[sceneId];
        console.log(gameTime)
        const elapsed_time = gameTime[0].elapsed_time;
        console.log("found elapsed_time of current game: ", elapsed_time, gameTime)
        res
          .status(200)
          .json({
            message: "Success",
            id: gameId,
            elapsed_time,
            topTen,
          });
      } else {
        throw new AppError("Failed to get the current game values")
      }
    } else {
      throw new AppError("Failed to get the top ten for the scene");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function setUsername(req, res) {
  const gameId = req.session.gameIds[req.params.id];
  
    try {
      if (gameId) {
        // find the top ten for this scene and see if the current game is in the top?
        const topTen = await inTopTen(req.params.id, gameId);
        console.log("in setUsername: ",topTen.length)
        if (topTen.length > 0) {
          const game = await dbSetUsername(gameId, req.body.username);
          if (game) {
            res.status(200).json({ message: "Success", game });
          } else {
            throw new AppError("Failed to set the username for this game");
          }
        } else {
          res.status(400).json({ message: "This game is not in the top ten" });
        }
      } else {
        throw new AppError("Failed to get game id from the current session");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
}

export function calculateElapsedTime(startTime, endTime) {
  console.log("calculateElpasedTime: ", startTime, endTime);
  return new Date(endTime).valueOf() - new Date(startTime).valueOf();
}

function inRange(correctAnswer, userAnswer, tolerance) {
  console.log("in inRange: ", correctAnswer, userAnswer);
  const diff = Math.abs(correctAnswer - userAnswer).toFixed(2);
  console.log("the diff is: ", diff);
  return diff < tolerance; 
}

function checkGameAnswers(answerArr, value) {
  console.log("in checkGameAnswers:", answerArr, value);

  return answerArr.reduce((acc, el) => {
    console.log(
      "check equal: ",
      el.character_name.name.toLowerCase(),
      value.toLowerCase()
    );
    return acc || el.character_name.name.toLowerCase() === value.toLowerCase();
  }, false);
}
