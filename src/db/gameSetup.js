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