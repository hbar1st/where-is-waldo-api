import { param, query, body } from "express-validator";
import {
  getSceneById,
  getGame,
  getCharacterKey,
} from "../db/gameSetup.js";
import { AppError } from "../errors/AppError.js";
import { ValidationError } from "../errors/ValidationError.js";

export const checkSceneId = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("A scene id is required to complete the request.")
    .isInt()
    .withMessage("The scene id should be an int")
    .bail()
    .toInt()
    .custom(async (value) => {
      console.log("try to validate if the scene id exists: ", value);
      try {
        const sceneRow = await getSceneById(value);

        console.log("scene row found: ", sceneRow);
        if (!sceneRow) {
          throw new ValidationError("This scene id is invalid.", []);
        } else {
          return true;
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }),
];

export const checkCoordinates = [
  query("x")
    .trim()
    .notEmpty()
    .withMessage("an x coordinate is required")
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("the x coordinate should be a number between 0 and 100")
    .toFloat(),
  query("y")
    .trim()
    .notEmpty()
    .withMessage("a y coordinate is required")
    .isFloat({
      min: 0,
      max: 100,
    })
    .withMessage("the y coordinate should be a number between 0 and 100")
    .toFloat(),
];

export const checkCharacter = [
  query("character")
    .trim()
    .notEmpty()
    .withMessage("A character is required to complete the request")
    .bail()
    .custom(async (value, { req }) => {
      console.log("try to validate the character name exists for the scene");
      const game = await getGame(req.session.gameId);
      if (game) {
        console.log("game is: ", game);
        const characters = [];
        const validCharacter = game.scene.answers.reduce((acc, el, i) => {
          characters.push(el["character_name"].name);
          acc = acc || el["character_name"].name === value;
          return acc;
        }, false);
        if (!validCharacter) {
          throw new ValidationError(
            `The character name ${value} is invalid. Must be one of [${characters}]`
          );
        }
      } else {
        throw new ValidationError("Failed to find the game's details", []);
      }
    })
    .bail()
    .customSanitizer(async (value) => {
      try {
        const characterKey = await getCharacterKey(value);
        return characterKey;
      } catch (error) {
        console.error(error);
        throw new AppError("Failed to map the character name to its key");
      }
    }),
];

export const checkSessionGameId = (req, res, next) => {
  const gameId = req.session.gameId;
  if (gameId) {
    next();
  } else {
    throw new ValidationError(`Failed to find the gameId in the session: ${req.session.id} \n ${req.method} ${req.originalUrl}`);
  }
};

export const checkUsername = [
  body('username').trim().notEmpty().withMessage("username should not be blank")
    .isString().withMessage("username should be a string")
  .isLength({min: 1, max: 25}).withMessage("username length should be between 1 and 25 characters")
]