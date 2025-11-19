
import { AppError } from "../errors/AppError.js"
import { getScene as dbGetScene, getSceneCharacters } from "../db/gameSetup.js"
import { matchedData } from "express-validator";

export async function getScene (req, res) {
  try {
    const scene = await dbGetScene();
    if (scene) {
      res.status(200).json({
        id: scene.id,
        url: scene.url
      });
    } else {
      throw new AppError("Failed to find a scene");
    }
  } catch (error) {
    console.log(error, error.stack);
    throw error;
  }
};

export async function getCharacters(req, res) {
  res.status(200).send("message");
  /*
  try {
  const {id} = matchedData(req);
    const characters = await getSceneCharacters(req.params.id)
  }
  */
}