import { param, query } from "express-validator";
import { getSceneById } from "../db/gameSetup.js";
import { AppError } from "../errors/AppError.js";

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
          throw new Error("This scene id is invalid.");
        } else {
          return true;
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    })
  ]

export const checkCharacter = [
  query("character")
    .trim()
    .notEmpty()
    .withMessage("A character is required to complete the request")
    .bail()
    .custom(async (value) => {
    console.log("try to validate the character name exists for the scene")
  })
]

export const checkGameId = (req, res, next) => {
  const gameId = req.session.gameId;
  if (gameId) {
    next();
  } else {
    throw new AppError("Failed to find the gameId in the session")
  }
}