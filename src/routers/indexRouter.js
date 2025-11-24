import express from "express";
import {
  getScene,
  getCharacters,
  getGame,
  setupGame,
  getSessionData,
  getGameID,
  evaluateAnswer,
  getTopTen,
  setUsername,
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

indexRouter
  .route("/game")
  .get(setupGame, getGame)
  .post(
    checkSessionGameId,
    checkUsername,
    handleExpressValidationErrors,
    setUsername
  );

indexRouter.put(
  "/game/answer",
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
