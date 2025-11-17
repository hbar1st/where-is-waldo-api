import { app } from "../src/serverSetup";
import { expect, test, beforeEach, afterEach } from "vitest";
import request from "supertest";


test("response status 404", async () => {
  const route = "/bad-route"
  const res = await request(app)
    .get(route)

    .set("Accept", "application/json");

  expect(res.status).toEqual(404);
  expect(res.body.status).toEqual("fail");
  expect(res.body.message).toEqual(
    `This is a surprising request. I can't find ${route} on this server!`
  );
  console.log("response: ", res.text, res.body);
});