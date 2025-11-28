import { app } from "../src/serverSetup";

import {
  expect,
  test,
  describe,
  beforeAll,
  beforeEach,
  vi,
  afterAll,
} from "vitest";
import request from "supertest";
import { clearGameAndSessionRows } from "../src/db/gameSetup";

import util from "node:util";

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

  test("GET /scene/:id/characters scene id does not exist", async () => {
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
    // first get the current scene id
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
          {
            name: "Odlaw",
            url: "https://res.cloudinary.com/hbrwdfccc/image/upload/v1763875339/Where%27s%20Waldo/odlaw.png",
          },
          {
            name: "Waldo",
            url: "https://res.cloudinary.com/hbrwdfccc/image/upload/v1763874393/Where%27s%20Waldo/wally.jpg",
          },
          {
            name: "Wizard Whitebeard",
            url: "https://res.cloudinary.com/hbrwdfccc/image/upload/v1763875403/Where%27s%20Waldo/wizard.png",
          },
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

describe("test answers", () => {
  let agent;

  beforeAll(async () => {
    clearGameAndSessionRows();

    agent = request.agent(app);
    const route = "/game";
    await agent
      .get(route)

      .set("Accept", "application/json");
  });

  
  afterAll(async () => {
    clearGameAndSessionRows();
  });

  test("PUT /game/answer?x=0&y=0 missing character name", async () => {
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

  test("PUT /game/answer?x=0&y=0&character=Odlaw wrong location", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ y: 0 })
      .query({ x: 0 })
      .query({ character: "Odlaw" })

      .set("Accept", "application/json");

    console.log(res.body);
    expect(res.status).toEqual(400);
    expect(res.body).toMatchObject({
      message: "Wrong answer",
      x: "0",
      y: "0",
      character: "Odlaw",
    });
  });

  test("PUT /game/answer?x=0.07&y=24.82&character=Waldo wrong character", async () => {
    const res = await agent
      .put(`/game/answer`)

      .query({ x: 0.07 })
      .query({ y: 24.82 })
      .query({ character: "Waldo" })

      .set("Accept", "application/json");

    console.log(res.body);
    expect(res.status).toEqual(400);
    expect(res.body).toMatchObject({
      message: "Wrong answer",
      x: "0.07",
      y: "24.82",
      character: "Waldo",
    });
  });

  test.each([
    { x: 0.07, y: 24.82, character: "Odlaw" },
    { x: 0.06, y: 24.83, character: "Odlaw" },
    { x: 10.48, y: 25.11, character: "Waldo" },
  ])(
    "PUT /game/answer?x=$x&y=$y&character=$character correct answer",
    async ({ x, y, character }) => {
      const res = await agent
        .put(`/game/answer`)

        .query({ x: x })
        .query({ y: y })
        .query({ character: character })

        .set("Accept", "application/json");

      expect(res.status).toEqual(200);
      expect(res.body).toMatchObject({
        message: "Correct answer",
        x: `${x}`,
        y: `${y}`,
        character: character,
      });
    }
  );
});

describe("test top ten", () => {
  let agent;
  beforeAll(async () => {
    clearGameAndSessionRows();
  });

  beforeEach(async () => {
    agent = request.agent(app);
    const route = "/game";
    const res = await agent
      .get(route)

      .set("Accept", "application/json");
    
    
    expect(res.status).toEqual(200);
  });
  
  afterAll(async () => {
    clearGameAndSessionRows();
  });

  test.each([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000])(
    "PUT /game/answer all characters found & top ten %#",
    async (delay) => {
      const res1 = await agent
        .put("/game/answer")
        .query({ x: 0.07, y: 24.82, character: "Odlaw" })
        .set("Accept", "application/json");

      expect(res1.status).toEqual(200); //first correct answer

      const res2 = await agent
        .put("/game/answer")
        .query({ x: 10.48, y: 25.11, character: "Waldo" })
        .set("Accept", "application/json");

      expect(res2.status).toEqual(200); //second correct answer

      const wait = util.promisify(setTimeout);
      await wait(delay);

      const res3 = await agent
        .put("/game/answer")
        .query({ x: 48.08, y: 20.61, character: "Wizard Whitebeard" })
        .set("Accept", "application/json");

      expect(res3.status).toEqual(200);
      expect(res3.body).toMatchObject({
        message: "Correct answer",
        x: "48.08",
        y: "20.61",
        character: "Wizard Whitebeard",
        inTopTen: true,
      });
      expect(res3.body).toHaveProperty("end_time");

      // test trying to record username since elapsed_time is in top ten
      const username = `bestOfTheBest-${delay}`;
      const game = await agent
        .post("/game")

        .set("Accept", "application/json")

        .send({ username });

      expect(game.status).toEqual(200);
      expect(game.body.message).toEqual("Success");
      expect(game.body).toHaveProperty("game");
      expect(game.body.game).toMatchObject({
        username,
      });

      // get the scene then try to get the top ten to see if the user name is recorded
      const scene = await agent
        .get("/scene")

        .set("Accept", "application/json");

      expect(scene.body.id).toBeTypeOf("number");
      const sceneId = scene.body.id;

      const topTen = await agent
        .get(`/scene/${sceneId}/topten`)
        .set("Accept", "application/json");

      expect(topTen.status).toEqual(200);
      expect(topTen.body).toHaveProperty("topTen");
      expect(topTen.body.topTen.length).toBeGreaterThanOrEqual(1);
      const topTenUsernames = [];

      for (let i = 0; i < topTen.body.topTen.length; i++) {
        topTenUsernames.push(topTen.body.topTen[i].username);

        expect(topTen.body.topTen[i].id).toBeDefined();
        expect(topTen.body.topTen[i].elapsed_time).toBeDefined();
      }
      expect(topTenUsernames).toContain(username);
    }
  );

  test("PUT /game/answer not in top ten", async () => {
    const res1 = await agent
      .put("/game/answer")
      .query({ x: 0.07, y: 24.82, character: "Odlaw" })
      .set("Accept", "application/json");

    expect(res1.status).toEqual(200); //first correct answer

    const res2 = await agent
      .put("/game/answer")
      .query({ x: 10.48, y: 25.11, character: "Waldo" })
      .set("Accept", "application/json");

    expect(res2.status).toEqual(200); //second correct answer

    // wait 1/4 second before ending the game
    const wait = util.promisify(setTimeout);
    await wait(1250);

    const res3 = await agent
      .put("/game/answer")
      .query({ x: 48.08, y: 20.61, character: "Wizard Whitebeard" })
      .set("Accept", "application/json");

    expect(res3.status).toEqual(200);
    expect(res3.body).toMatchObject({
      message: "Correct answer",
      x: "48.08",
      y: "20.61",
      character: "Wizard Whitebeard",
      inTopTen: false,
    });
    expect(res3.body).toHaveProperty("end_time");

    // test trying to record username when he's not in top ten
    const game = await agent
      .post("/game")

      .set("Accept", "application/json")

      .send({ username: "hacker" });

    expect(game.status).toEqual(400);
    expect(game.body.message).toEqual("This game is not in the top ten");
  });

  test("GET /scene/:id/topten happy path", async () => {
    const scene = await agent
      .get("/scene")

      .set("Accept", "application/json");

    expect(scene.body.id).toBeTypeOf("number");
    const sceneId = scene.body.id;

    const topTen = await agent
      .get(`/scene/${sceneId}/topten`)
      .set("Accept", "application/json");

    expect(topTen.status).toEqual(200);
    expect(topTen.body).toHaveProperty("topTen");
    expect(topTen.body.topTen).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(topTen.body.topTen[i]).toHaveProperty("username");
      expect(topTen.body.topTen[i]).toHaveProperty("id");
      expect(topTen.body.topTen[i]).toHaveProperty("elapsed_time");
    }
  });

  test("POST /game - username blank in request body", async () => {
    const game = await agent
      .post("/game")

      .set("Accept", "application/json")

      .send({ username: "" });

    expect(game.status).toEqual(400);
    expect(game.body.message).toEqual(
      "Action has failed due to some validation errors"
    );

    expect(game.body.details).toBeDefined();
    expect(game.body.details.length).toEqual(2);
    const resDetails = {
      type: "field",
      value: "",
      msg: "username should not be blank",
      path: "username",
      location: "body",
    };
    expect(game.body.details[0]).toMatchObject(resDetails);
  });

  test("POST /game - username not found in request body", async () => {
    const game = await agent.post("/game").set("Accept", "application/json");

    expect(game.status).toEqual(400);
    expect(game.body.message).toEqual(
      "Action has failed due to some validation errors"
    );
    console.log(game.body);
    expect(game.body.details).toBeDefined();
  });

  //end of describe section
});

describe("test ongoing game", () => {
  let agent;

  beforeEach(async () => {
    agent = request.agent(app);
    const route = "/game";
    await agent.get(route).set("Accept", "application/json");
  });

  beforeAll(async () => {
    clearGameAndSessionRows();
  });

  test("GET /game after one correct answer", async () => {
    const res1 = await agent
      .put("/game/answer")
      .query({ x: 0.07, y: 24.82, character: "Odlaw" })
      .set("Accept", "application/json");

    expect(res1.status).toEqual(200); //first correct answer

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
    expect(res.body.game.scene.characters).toHaveLength(2);
    expect(res.body.game.scene).toEqual({
      id: expect.toSatisfy((input) => Number.isInteger(input)),
      url: expect.stringMatching(/^https:\/\/.*\.jpg/),
      characters: expect.arrayContaining(["Waldo", "Wizard Whitebeard"]),
    });
  });

  test("GET /game after 2 correct answers", async () => {
    const res1 = await agent
      .put("/game/answer")
      .query({ x: 0.07, y: 24.82, character: "Odlaw" })
      .set("Accept", "application/json");

    expect(res1.status).toEqual(200); //first correct answer

    const res2 = await agent
      .put("/game/answer")
      .query({ x: 10.47, y: 25.11, character: "Waldo" })
      .set("Accept", "application/json");

    expect(res2.status).toEqual(200); //second correct answer

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
    expect(res.body.game.scene.characters).toHaveLength(1);
    expect(res.body.game.scene).toEqual({
      id: expect.toSatisfy((input) => Number.isInteger(input)),
      url: expect.stringMatching(/^https:\/\/.*\.jpg/),
      characters: expect.arrayContaining(["Wizard Whitebeard"]),
    });
  });

  test("GET /scene/:id/topten invalid id", async () => {
    const topTen = await agent
      .get(`/scene/0/topten`)
      .set("Accept", "application/json");

    expect(topTen.status).toEqual(400);
  });

  test("GET /scene/:id/topten none found", async () => {
    const scene = await agent
      .get("/scene")

      .set("Accept", "application/json");

    expect(scene.body.id).toBeTypeOf("number");
    const sceneId = scene.body.id;

    const topTen = await agent
      .get(`/scene/${sceneId}/topten`)
      .set("Accept", "application/json");

    expect(topTen.status).toEqual(200);
    expect(topTen.body).toHaveProperty("topTen");
    const resDetails = {};
    expect(topTen.body.topTen).toMatchObject(resDetails);
  });
});

test("POST /game - game id invalid", async () => {
  const game = await request(app)
    .post("/game")
    .set("Accept", "application/json")

    .send({ username: "hacker" });

  expect(game.status).toEqual(400);
  expect(game.body.message).toContain(
    "Failed to find the gameId in the session"
  );
});
