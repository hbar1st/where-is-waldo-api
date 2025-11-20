import express from "express";
import { getScene, getCharacters, getGame, setupGame, getSessionData, getGameID } from "../controllers/gameController.js"
import { checkSceneId } from "../validators/gameValidator.js"
import { handleExpressValidationErrors } from "./routerUtil.js";
import { AppError } from "../errors/AppError.js";

export const indexRouter = express.Router();

indexRouter.get("/", (req, res) => {
  res.status(200).json({
    message:
      "The Where's Waldo API supports hbar1st's TOP Where's Waldo project.",
  });
});

// getting a scene also starts a game (and the start time is recorded)
indexRouter.get("/scene", getScene);

indexRouter.get(
  "/scene/:id/characters",
  checkSceneId,
  handleExpressValidationErrors,
  getCharacters
);

indexRouter.get(
  "/game",
  async (req, res, next) => {
    console.log("the current session id: ", req.session.id)
    const sData = await getSessionData(req.session.id);
    if (sData) {
      next();
    } else {
      throw new AppError(
        "the session record is not available, retry the request"
      );
    }
  },
  (req, res, next) => {
    console.log(req.session.id);
    getGameID(req.session.id)
      .then((gameID) => {
        if (!gameID) {
          console.log("cookie doesn't have a game initialized!");
          setupGame(req.session.id); // creates a new anonymous user game with start time and first scene and saves the game id in the session data field
        } else {
          console.log(`this session has a game already ${gameID}`);
        }
        next();
      })
      .catch((error) => {
        throw new AppError(
          "something went wrong getting the game id from the session"
        );
      });
  },
  getGame
);