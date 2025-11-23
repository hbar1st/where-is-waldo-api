import { prisma } from "../../src/middleware/prisma.mjs";

// we only have one scene to play with, but maybe later on we can add more and return different ones?
export async function getScene() {
  console.log("in getScene");
  const scene = await prisma.scene.findFirst({
    select: {
      id: true,
      url: true,
    },
  });
  return scene;
}

export async function getSceneById(id) {
  console.log("in getSceneById: ", id);
  if (id) {
    const scene = await prisma.scene.findUnique({
      where: {
        id: Number(id),
      },
    });
    return scene;
  } else {
    console.error("id is missing");
  }
}

export async function getSceneCharacters(id) {
  console.log("in getSceneCharacters: ", id);
  if (id) {
    const characters = await prisma.answer.findMany({
      where: {
        scene_id: Number(id),
      },
      select: {
        character_name: {
          select: {
            name: true,
          },
        },
      },
    });
    return characters;
  } else {
    console.error("id is missing");
  }
}
export async function inTopTen(gameId) {
  console.log("in inTopTen: ", gameId);

  const result = await prisma.$queryRawUnsafe(
    `SELECT *
FROM (
  SELECT id, CAST(end_time - start_time AS Text) AS elapsed_time 
  FROM game
  ORDER BY elapsed_time ASC
  LIMIT 10
) AS top10
WHERE id = ${gameId};`
  );
  return result;
}

export async function endGame(game_id) {
  console.log("in endGame: ", game_id);
  let game = await prisma.game.update({
    where: {
      id: Number(game_id),
    },
    data: {
      end_time: new Date().toISOString(),
    },
  });
  
  return game;
}

export async function clearGameAndSessionRows() {
  console.log(" in clearGameAndSessionRows");
  await prisma.game.deleteMany();
  await prisma.session.deleteMany();
}

export async function addGame(scene_id) {
  console.log("in addGame: ", scene_id);
  const game = await prisma.game.create({
    data: {
      username: "anonymous",
      start_time: new Date().toISOString(),
      scene_id: Number(scene_id),
    },
  });
  return game;
}

export async function getSession(sid) {
  console.log("in getSession: ", sid);
  const session = await prisma.session.findFirst({
    where: {
      sid,
    },
  });
  console.log(session);
  return session;
}

export async function getAllSessions() {
  console.log("in getAllSessions");
  const sessions = await prisma.session.findMany();
  console.log("all sessions: ", sessions);
  return sessions;
}

export async function getGame(id) {
  console.log("in getGame: ", id);
  const game = await prisma.game.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      scene: {
        include: {
          answers: {
            select: {
              character_name: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      gameAnswers: {
        select: {
          location_x: true,
          location_y: true,
          character_name: {
            select: {
              name: true
            }
          }
        }
      },
    },
  });
  return game;
}

export async function getGameScene(id) {
  console.log("in getGameScene: ", id);
  const gameId = await prisma.game.findFirst({
    where: {
      id: Number(id),
    },
    select: {
      scene_id: true,
    },
  });
  return gameId;
}

export async function getCharacterKey(name) {
  console.log("in getCharacterKey: ", name);
  const characterRow = await prisma.characterName.findFirst({
    where: {
      name,
    },
    select: {
      character: true,
    },
  });
  return characterRow;
}

export async function getAnswer(sceneId, characterKey) {
  console.log("in getAnswer: ", sceneId, characterKey);
  const answerRow = await prisma.answer.findFirst({
    where: {
      scene_id: Number(sceneId),
      character: characterKey,
    },
    select: {
      location_x: true,
      location_y: true,
    },
  });
  return answerRow;
}

export async function getSceneAnswerCount(sceneId) {
  console.log("in getSceneAnswerCount: ", sceneId);
  const count = await prisma.answer.count({
    where: {
      scene_id: Number(sceneId),
    },
  });
  return count;
}

export async function getGameAnswerCount(gameId) {
  console.log("in getGameAnswerCount: ", gameId);
  const count = await prisma.game_Answer.count({
    where: {
      game_id: Number(gameId),
    },
  });
  return count;
}

export async function setGameAnswer(gameId, character, x, y) {
  console.log("in setGameAnswer: ", gameId, character, x, y);
  const gameAnswer = await prisma.game_Answer.upsert({
    create: {
      game_id: Number(gameId),
      character: character,
      location_x: Number(x),
      location_y: Number(y),
    },
    update: {
      character,
      location_x: Number(x),
      location_y: Number(y),
    },
    where: {
      game_id_character: {
        character,
        game_id: Number(gameId),
      },
    },
  });
  return gameAnswer;
}
