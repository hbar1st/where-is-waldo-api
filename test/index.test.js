import { app } from "../src/serverSetup";
import { expect, test, describe, beforeEach, afterEach } from "vitest";
import request from "supertest";
import superagent from "superagent";

test("GET invalid route -> 404", async () => {
  const route = "/bad-route";
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
});

/** check that we get a cookie */
test("GET / gives a cookie", async () => {
  const route = "/scene";
  const res = await request
    .agent(app)
    .get(route)

    .set("Accept", "application/json");

  expect(res.status).toEqual(200);
  expect(res.headers["set-cookie"]).toBeDefined();
  console.log("cookie: ", res.headers["set-cookie"]);
});

describe("initial game setup", () => {
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
  });

  test("GET /scene/:id/characters invalid scene id", async () => {
    const sceneId = 'a';
      console.log(`invalid scene id: ${sceneId}`);
      const route = `/scene/${sceneId}/characters`;
      const res = await agent
        .get(route)

        .set("Accept", "application/json");

    expect(res.status).toEqual(400);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.message).toEqual(
      "Action has failed due to some validation errors"
    );
    expect(res.body.details).toBeDefined();
    expect(res.body.details.length).toEqual(1);

    const resDetails = {
      type: "field",
      value: "a",
      msg: "The scene id should be an int",
      path: "id",
      location: "params",
    };
    expect(res.body.details[0]).toMatchObject(resDetails);

  });

    test("GET /scene/:id/characters scnee id does not exist", async () => {
      const sceneId = 0;
      console.log(`invalid scene id: ${sceneId}`);
      const route = `/scene/${sceneId}/characters`;
      const res = await agent
        .get(route)

        .set("Accept", "application/json");

      expect(res.status).toEqual(400);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.message).toEqual(
        "Action has failed due to some validation errors"
      );
      expect(res.body.details).toBeDefined();
      expect(res.body.details.length).toEqual(1);

      const resDetails = {
        type: "field",
        value: 0,
        msg: "This scene id is invalid.",
        path: "id",
        location: "params",
      };
      expect(res.body.details[0]).toMatchObject(resDetails);
    });
  
  /** this route gets the character names that belong to a specific scene */
  test("GET /scene/:id/characters happy path", async () => {
    const scene = await agent
      .get("/scene")

      .set("Accept", "application/json");

    expect(scene.body.id).toBeTypeOf("number");
    const sceneId = scene.body.id;
    if (sceneId) {
      console.log(`try to get characters for scene id: ${sceneId}`);
      const route = `/scene/${sceneId}/characters`;
      const res = await agent
        .get(route)

        .set("Accept", "application/json");

      expect(res.status).toEqual(200);
      expect(res.body.characters).toBeDefined();
      expect(res.body).toEqual({
        message: 'success',
        characters: expect.arrayContaining(['Odlaw', 'Waldo', 'Wizard Whitebeard'])
      })
  
    }
  });
});
