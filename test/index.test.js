import { app } from "../src/serverSetup";
import { expect, test, describe, beforeEach, afterEach } from "vitest";
import request from "supertest";
import superagent from "superagent";


test("GET invalid route -> 404", async () => {
  const route = "/bad-route"
  const res = await request(app)
    .get(route)

    .set("Accept", "application/json");

  expect(res.status).toEqual(404);
  expect(res.body.status).toEqual("fail");
  expect(res.body.message).toEqual(
    `This is a surprising request. I can't find ${route} on this server!`
  );
});

/** this route gets a basic description of the api */
test("GET / success", async () => {
  const route = "/";
  const res = await request(app)
    .get(route)

    .set("Accept", "application/json");
  
  expect(res.status).toEqual(200);
  expect(res.body.message).toEqual(
    "The Where's Waldo API supports hbar1st's TOP Where's Waldo project."
  );
})

/** check that we get a cookie */
test("GET / gives a cookie", async () => {
  const route = "/scene";
  const res = await request.agent(app)
    .get(route)
  
    .set("Accept", "application/json");
  
  expect(res.status).toEqual(200);
  expect(res.headers["set-cookie"]).toBeDefined();
  console.log("cookie: ",res.headers["set-cookie"])
})

describe('initial game setup', () => {
  const agent = request.agent(app);

  /** this route gets the url of the image we are playing where's waldo with */
  test("GET /scene", async () => {
    const route = "/scene";
    const res = await agent
      .get(route)
  
      .set("Accept", "application/json");
  
    expect(res.status).toEqual(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body.url).toBeDefined();
    expect(res.body.url).toBeTypeOf("string");
    expect(res.body.url).toMatch(/^https:\/\/.*\.jpg/);
    expect(res.body.id).toBeTypeOf("number");

    
    console.log("cookie: ", res.headers["set-cookie"]);
  })

  /** this route gets the character names that belong to a specific scene */
  test("GET /scene/:id/characters", async () => {
    const scene = await agent
      .get("/scene")
    
      .set("Accept", "application/json")
    
    expect(scene.body.id).toBeTypeOf("number");
    const sceneId = scene.body.id;
    if (sceneId) {
      console.log(`try to get characters for scene id: ${sceneId}`)
      const route = `/scene/${sceneId}/characters`;
      const res = await agent
        .get(route)

        .set("Accept", "application/json")
    
      expect(res.status).toEqual(200);
    }
  });

})