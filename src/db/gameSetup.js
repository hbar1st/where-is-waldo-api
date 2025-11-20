import { prisma } from "../../src/middleware/prisma.mjs";

// we only have one scene to play with, but maybe later on we can add more and return different ones?
export async function getScene() {
  console.log('in getScene');
  const scene = await prisma.scene.findFirst({
    select: {
      id: true,
      url: true
    }
  })
  return scene;
}

export async function getSceneById(id) {
  console.log("in getSceneById: ", id)
  if (id) {
    const scene = await prisma.scene.findUnique({
      where: {
        id: Number(id)
      }
    })
    return scene;
  } else {
    console.error("id is missing");
  }
}
  
export async function getSceneCharacters(id) {
  console.log("in getSceneCharacters: ", id)
  if (id) {
    const characters = await prisma.answer.findMany({
      where: {
        scene_id: Number(id)
      },
      select: {
          character_name: {
            select: {
              name: true
            }
          }
        
      }
    })
    return characters;
  } else {
    console.error("id is missing")
  }
}

export async function addGame(scene_id) {
  console.log("in addGame: ", scene_id);
  const game = await prisma.game.create({
    data: {
      username: "anonymous",
      start_time: new Date().toISOString(),
      scene_id: Number(scene_id)
    },
  });
  return game;
}

export async function updateSessionData(sid, sData) {
  console.log("in updateSessionData: ", sid, sData);
  const session = await prisma.session.update({
    where: {
      sid,
    },
    data: {
      data: sData
    }
  })
  return session;
}

export async function getSession(sid) {
  console.log("in getSession: ", sid);
  const session = await prisma.session.findFirst({
    where: {
      sid
    }
  })
  console.log(session)
  return session;
}

export async function getAllSessions() {
  console.log("in getAllSessions");
  const sessions = await prisma.session.findMany();
  console.log(sessions);
  return sessions;
}

export async function getGame(id) {
  console.log("in getGame: ", id);
  const game = await prisma.game.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      scene: true,
      answers: true
    }
  })
  return game;
}