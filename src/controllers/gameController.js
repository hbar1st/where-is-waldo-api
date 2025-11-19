
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
    console.error(error);
    throw error;
  }
};

export async function getCharacters(req, res) {
  try {
  const {id} = matchedData(req);
    const characters = await getSceneCharacters(id);
    if (characters) {
      console.log(characters);
      res.status(200).json({
        message: "success",
        characters: characters.reduce((acc, el) => {
          acc.push(el["character_name"].name);
          return acc;
        }, [])
      });
    } else {
      throw new AppError("Failed to get the scene characters")
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
  
}