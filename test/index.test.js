import { app } from "../src/serverSetup";
import { CookieAccessInfo } from 'cookiejar';
import { expect, test, describe, beforeAll, afterEach } from "vitest";
import request from "supertest";

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

describe.skip("initial game setup", () => {
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


  });

  test("GET /scene/:id/characters invalid scene id", async () => {
    const sceneId = "a";
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

    console.log("cookie: ", res.headers["set-cookie"]);
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
        message: "success",
        characters: expect.arrayContaining([
          "Odlaw",
          "Waldo",
          "Wizard Whitebeard",
        ]),
      });
    }
  });

  test("GET /game", async () => {
    const res = await agent

      .get("/game")

      .set("Accept", "application/json");

    expect(res.status).toEqual(200);
    expect(res.body.message).toEqual("success");
    expect(res.body.game).toBeTypeOf("object");
    expect(res.body.game).toHaveProperty("id");
    expect(res.body.game).toHaveProperty("username", "anonymous");
    expect(res.body.game).toHaveProperty("start_time");
    expect(res.body.game.start_time).toBeTypeOf("number");
    expect(res.body.game).toHaveProperty("end_time", null);
    expect(res.body.game).toHaveProperty("scene");
    expect(res.body.game.scene).toHaveProperty("characters");
    expect(res.body.game.scene).toEqual({
      id: expect.toSatisfy((input) => Number.isInteger(input)),
      url: expect.stringMatching(/^https:\/\/.*\.jpg/),
      characters: expect.arrayContaining([
        "Odlaw",
        "Waldo",
        "Wizard Whitebeard",
      ]),
    });
  });
});

describe.only("test answers", () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    const route = "/game";
    await agent
      .get(route)

      .set("Accept", "application/json");

  });

  test.only("PUT /game/answer?x=0&y=0 missing character name", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ x: 0 })
      .query({ y: 0 })

      .set("Accept", "application/json");

    expect(res.body).toMatchObject({
      statusCode: 400,
      message: "Action has failed due to some validation errors",
      timestamp: expect.stringContaining("GMT"),
      details: expect.arrayContaining([
        {
          type: "field",
          value: "",
          msg: "A character is required to complete the request",
          path: "character",
          location: "query",
        },
      ]),
    });
  });

  test("PUT /game/answer?x=0&y=0&character=invalid invalid character name", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ x: 0 })
      .query({ y: 0 })
      .query({ character: "invalid" })

      .set("Accept", "application/json");

    expect(res.body).toMatchObject({
      statusCode: 400,
      message: "Action has failed due to some validation errors",
      timestamp: expect.stringContaining("GMT"),
      details: expect.arrayContaining([
        {
          type: "field",
          value: "invalid",
          msg: "The character name invalid is invalid. Must be one of [Odlaw,Waldo,Wizard Whitebeard]",
          path: "character",
          location: "query",
        },
      ]),
    });
  });

  test("PUT /game/answer?y=0&character=Odlaw missing x", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ y: 0 })
      .query({ character: "Odlaw" })

      .set("Accept", "application/json");

    expect(res.body).toMatchObject({
      statusCode: 400,
      message: "Action has failed due to some validation errors",
      timestamp: expect.stringContaining("GMT"),
      details: expect.arrayContaining([
        {
          type: "field",
          value: "",
          msg: "an x coordinate is required",
          path: "x",
          location: "query",
        },
        {
          type: "field",
          value: "",
          msg: "the x coordinate should be a number between 0 and 100",
          path: "x",
          location: "query",
        },
      ]),
    });
  });
  
  test.each([[-1], [101], ["a"]])(
    "PUT /game/answer?x=%s&y=0&character=Odlaw invalid x",
    async (x) => {
      const res = await agent
        .put(`/game/answer`)

        .query({ x: x })
        .query({ y: 0 })
        .query({ character: "Odlaw" })

        .set("Accept", "application/json");

      expect(res.body).toMatchObject({
        statusCode: 400,
        message: "Action has failed due to some validation errors",
        timestamp: expect.stringContaining("GMT"),
        details: expect.arrayContaining([
          {
            type: "field",
            value: `${x}`,
            msg: "the x coordinate should be a number between 0 and 100",
            path: "x",
            location: "query",
          },
        ]),
      });
    }
  );

  test("PUT /game/answer?x=0&character=Odlaw missing y", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ x: 0 })
      .query({ character: "Odlaw" })

      .set("Accept", "application/json");

    expect(res.body).toMatchObject({
      statusCode: 400,
      message: "Action has failed due to some validation errors",
      timestamp: expect.stringContaining("GMT"),
      details: expect.arrayContaining([
        {
          type: "field",
          value: "",
          msg: "a y coordinate is required",
          path: "y",
          location: "query",
        },
        {
          type: "field",
          value: "",
          msg: "the y coordinate should be a number between 0 and 100",
          path: "y",
          location: "query",
        },
      ]),
    });
  });

  test.each([[-1], [101], ["a"]])(
    "PUT /game/answer?x=0&y=%s&character=Odlaw invalid y",
    async (y) => {
      const res = await agent
        .put(`/game/answer`)

        .query({ y: y })
        .query({ x: 0 })
        .query({ character: "Odlaw" })

        .set("Accept", "application/json");

      expect(res.body).toMatchObject({
        statusCode: 400,
        message: "Action has failed due to some validation errors",
        timestamp: expect.stringContaining("GMT"),
        details: expect.arrayContaining([
          {
            type: "field",
            value: `${y}`,
            msg: "the y coordinate should be a number between 0 and 100",
            path: "y",
            location: "query",
          },
        ]),
      });
    }
  );

  test(
    "PUT /game/answer?x=0&y=0&character=Odlaw wrong location",
    async () => {
      const res = await agent
        .put(`/game/answer`)

        .query({ y: 0 })
        .query({ x: 0 })
        .query({ character: "Odlaw" })

        .set("Accept", "application/json");

      expect(res.body).toMatchObject({
        statusCode: 400,
        message: "Wrong answer",
      });
    }
  );
  
});
