import { param } from "express-validator";
import { getSceneById } from "../db/gameSetup.js";

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
