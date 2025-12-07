import express from "express";
import {
  getScene,
  getGameAnswers,
  getCharacters,
  getGame,
  setupGame,
  getSessionData,
  getGameID,
  evaluateAnswer,
  getTopTen,
  setUsername,
  checkSessionGameExists,
} from "../controllers/gameController.js";

import {
  checkSceneId,
  checkSessionGameId,
  checkCoordinates,
  checkCharacter,
  checkUsername,
} from "../validators/gameValidator.js";
import { handleExpressValidationErrors } from "./routerUtil.js";

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

indexRouter.get("/resumeGame", checkSessionGameExists);

indexRouter
  .route("/game")
  .get(setupGame, getGame)
  .put(
    checkSessionGameId,
    checkUsername,
    handleExpressValidationErrors,
    setUsername
  );

indexRouter
  .route("/game/answer")
  .get(checkSessionGameId, getGameAnswers)
  .put(
    checkSessionGameId,
    checkCoordinates,
    checkCharacter,
    handleExpressValidationErrors,
    evaluateAnswer
  );

indexRouter.get(
  "/scene/:id/topten",
  checkSceneId,
  handleExpressValidationErrors,
  getTopTen
);
