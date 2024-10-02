const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
//---------testing all themes retrieval -------
describe("GET /content/themes", () => {
  it("should have a status of 401 and an appropriate message since the token is missing", async () => {
    const response = await request(app).get("/content/themes");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVdCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Invalid")
    );
  });

  it("should have a success property of true and an appropriate message since the user has no themes currently", async () => {
    const response = await request(app)
      .get("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no created themes")
    );
  });

  it("should have a success property of true, status of 200 and a themes array", async () => {
    const response = await request(app)
      .get("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("themes");
  });
});

//---------testing themes retrieval for a specific verse -------
describe("GET /content/themes/:verse_key", () => {
  it("should have a status of 404 and an appropriate message since the verse key is invalid", async () => {
    const response = await request(app)
      .get("/content/themes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Ayah not found")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/themes/1:2")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVdCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Invalid")
    );
  });

  it("should have a success property of true and an appropriate message since the user has no themes on this verse currently", async () => {
    const response = await request(app)
      .get("/content/themes/1:1")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no themes")
    );
  });

  it("should have a success property of true, status of 200 and a themes array", async () => {
    const response = await request(app)
      .get("/content/themes/2:42")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("themes");
  });
});

//---------testing creating a theme -------
describe("POST /content/themes", () => {
  it("should have a status of 422 and an appropriate message since the name, colour and icon are not given in request body", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("name")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour and icon are not given in request body", async () => {
    const response = await request(app)
      .post("/content/themes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ name: "new test theme" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("colour")
    );
  });
  it("should have a status of 422 and an appropriate message since the icon is not given in request body", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ name: "new test theme", colour: "#767676" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("icon")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour should be of length 7", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        name: "new test theme",
        colour: "ssd",
        icon: "smiley",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("7 characters")
    );
  });

  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVdCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Invalid")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is missing", async () => {
    const response = await request(app).post("/content/themes/");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });

  it("should have a success property of true, status of 201 and a success message", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        name: `${Math.random()}theme`,
        colour: "#767676",
        icon: "smiley",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });
  it("should have a success property of false, since a user cannot create two themes with the same name", async () => {
    const response = await request(app)
      .post("/content/themes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        name: "new test theme",
        colour: "#767676",
        icon: "smiley",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });
});

//---------testing deleting themes-------
describe("DELETE /content/themes/", () => {
  it("should have a status of 400 bad request since the theme ids are not added", async () => {
    const response = await request(app)
      .delete("/content/themes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Invalid")
    );
  });
  it("should have a status of 400 bad request since one of the ids passed are invalid", async () => {
    const response = await request(app)
      .delete("/content/themes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        note_ids: ["66fbd40e3dac99928d7da72632"],
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });
  it("should have a status of 200 and a deleted count of 1 since one id is passed", async () => {
    const response = await request(app)
      .delete("/content/themes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        theme_ids: ["66fd1cf5dc2e7d3dc23cc03d"],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("deletedCount", 1);
  });
});

//---------adding a verse to a theme-------
describe("POST /content/themes/:theme_id/verses", () => {
  it("should have a status of 400 bad request since the verse key is not added", async () => {
    const response = await request(app)
      .post("/content/themes/66fd1cf5dc2e7d3dc23cc03d/verses")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Invalid")
    );
  });
  it("should have a status of 404 since the verse key passed is invalid and the verse does not exists", async () => {
    const response = await request(app)
      .post("/content/themes/66fd1cf5dc2e7d3dc23cc03d/verses")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        verse_key: "2:3232",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("success", false);
  });
  it("should have a status of 400 since the theme id in the URL does not exist", async () => {
    const response = await request(app)
      .post("/content/themes/66fd1cf5dc2e7d3dc23cc03h/verses")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        verse_key: "2:32",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });

  it("should return a 400 bad request, since the verse key passed is already added to the theme", async () => {
    const response = await request(app)
      .post("/content/themes/66fd1cf5dc2e7d3dc23cc03d/verses")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        verse_key: "2:42",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("success", false);
  });
});
