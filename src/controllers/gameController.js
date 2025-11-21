import { AppError } from "../errors/AppError.js";
import {
  getScene as dbGetScene,
  getSession,
  getGame as dbGetGame,
  getSceneCharacters,
  addGame,
  getGameScene,
  getCharacterKey,
  getAnswer,
} from "../db/gameSetup.js";
import { matchedData } from "express-validator";

/**
 * this method is sets up a new game only if the session doesn't have a gameId value already
 * it sets up the game with the first scene, username of 'anonymous' and the start time is set in epoch time //TODO need to fix that
 *
 * Later on, the game row will be updated whenever the user finds new characters and completes the game (end time will be recorded plus name if given)
 *
 * @param {*} sid the session id retrieved from the cookie
 */
export async function setupGame(req,res,next) {
  const sid = req.session.id;
  console.log("in setupGame: ", sid)
  if (!req.session.gameId) {
    // insert a new game into the game table and update the session with the new game id
    try {
      const scene = await dbGetScene(); //gets the first and only scene for now
      if (scene) {
        const game = await addGame(scene.id);
        if (game) {
          console.log("game.id: ", game.id);
          req.session.gameId = game.id;
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

export async function getGameID(sid) {
  console.log("in getGameID: ", sid)
  try {
    const sData = await getSessionData(sid);
    console.log("retrieved the parsed data: ", sData);
    if (sData) {
      return sData.cookie?.gameId;
    }
  } catch (error) {
    console.error(error);
    throw new AppError("Failed to get the session data")
  }
}

export async function getSessionData(sid) {
  console.log("in getSessionData: ", sid)
  try {
    const session = await getSession(sid);
    let sData = null;
    if (session) {
      console.log("retrieved the session: ", session);
      sData = await JSON.parse(session.data);
      console.log(sData);
    }
    return sData;
  } catch (error) {
    console.error(error)
    throw new AppError(`Failed to get the sesssion for ${sid}`)
  }
}

export async function getScene(req, res) {
  try {
    const scene = await dbGetScene();
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
          acc.push(el["character_name"].name);
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

export async function getGame(req, res) {
  console.log("in getGame: ", req.session.id);

  const sid = req.session.id;
  try {
    // extract the game_id from the session row
    let gameId = req.session.gameId;
    if (gameId) {
      console.log("found a game id: ", gameId)
      const game = await dbGetGame(gameId);

      // do a little data massaging
      // - turn the start time stamp into an epoch timestamp
      // - reorganize the return values so the db schema is not obvious and for the client's convenience
      console.log("start_time from the db: ", game.start_time)
      game.start_time = (new Date(game.start_time)).valueOf();
      console.log("start_time as epoch value: ", game.start_time)

      game.scene.characters = game.scene.answers.reduce((acc, el) => {
        acc.push(el["character_name"].name);
        return acc;
      }, []);
      delete game.scene.answers;
      return res.status(200).json({message: "success", game});
    } else {
      throw new AppError(`failed to get a game id from the current session: ${req.session.id}`)
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function evaluateAnswer(req, res) {
  console.log("in evaluateAnswer: ", req.query)
  const x = req.query.x;
  const y = req.query.y;
  const characterName = req.query.character;

  const sid = req.session.id;
  const gameId = req.session.gameId;

  try {
    const sceneId = await getGameScene(gameId);
    const characterKey = await getCharacterKey(characterName);
    const answerRow = await getAnswer(sceneId.scene_id, characterKey.character)
    if (answerRow) {
      if (inRange(answerRow.location_x, x) && inRange(answerRow.location_y, y)) {
        res.status(200).json({ message: "Correct answer", x, y, character: characterName });
      } else {
        res.status(400).json({ message: "Wrong answer", x, y, character: characterName })
      }
    } else {
      res.status(400).json({ message: "Wrong answer", x, y, character: characterName });
    }
  } catch (error) {
    console.error(error);
    throw (error)
  }
}

function inRange(correctAnswer, userAnswer) {
  console.log("in inRange: ", correctAnswer, userAnswer);
  const diff = (Math.abs(correctAnswer - userAnswer)).toFixed(2);
  console.log("the diff is: ", diff)
  return diff <= 0.01;
}