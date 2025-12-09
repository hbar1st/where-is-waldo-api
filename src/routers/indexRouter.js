import express from "express";
import {
  getScene,
  getGameAnswers,
  getCharacters,
  getAllScenes,
  getGame,
  setupGame,
  getSessionData,
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

// getting a list of scenes 
indexRouter.get("/scene", getAllScenes);

indexRouter.get("/scene/:id", checkSceneId, handleExpressValidationErrors, getScene);

indexRouter.get(
  "/scene/:id/game",
  checkSceneId,
  handleExpressValidationErrors,
  setupGame,
  getGame
);

indexRouter.get(
  "/scene/:id/characters",
  checkSceneId,
  handleExpressValidationErrors,
  getCharacters
);

indexRouter.get(
  "/scene/:id/resumeGame",
  checkSceneId,
  handleExpressValidationErrors,
  checkSessionGameExists
);

// call get /game starts the timer on the game
indexRouter
  .route("/scene/:id/game")
  .get(checkSceneId, handleExpressValidationErrors, setupGame, getGame)
  .put(
    checkSceneId,
    handleExpressValidationErrors,
    checkSessionGameId,
    checkUsername,
    handleExpressValidationErrors,
    setUsername
  );

indexRouter
  .route(["/scene/:id/game/answer", "/scene/:id/game/answers"])
  .get(
    checkSceneId,
    handleExpressValidationErrors,
    checkSessionGameId,
    getGameAnswers
  )
  .put(
    checkSceneId,
    handleExpressValidationErrors,
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
