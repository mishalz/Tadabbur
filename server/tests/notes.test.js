const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
//---------testing all notes retrieval -------
describe("GET /content/notes", () => {
  it("should have a status of 401 and an appropriate message since the token is missing", async () => {
    const response = await request(app).get("/content/notes");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/notes")
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

  it("should have a success property of true and an appropriate message since the user has no notes currently", async () => {
    const response = await request(app)
      .get("/content/notes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no notes")
    );
  });

  it("should have a success property of true, status of 200 and a notes array", async () => {
    const response = await request(app)
      .get("/content/notes")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("notes");
  });
});

//---------testing notes retrieval for a specific verse -------
describe("GET /content/notes/:verse_key", () => {
  it("should have a status of 404 and an appropriate message since the verse key is invalid", async () => {
    const response = await request(app)
      .get("/content/notes/123")
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
      .get("/content/notes/1:2")
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

  it("should have a success property of true and an appropriate message since the user has no notes currently", async () => {
    const response = await request(app)
      .get("/content/notes/1:1")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no notes")
    );
  });

  it("should have a success property of true, status of 200 and a notes array", async () => {
    const response = await request(app)
      .get("/content/notes/1:5")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("notes");
  });
});

//---------testing creating a note -------
describe("POST /content/notes/:verse_key", () => {
  it("should have a status of 422 and an appropriate message since the heading, content and colour are not given in request body", async () => {
    const response = await request(app)
      .post("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("heading")
    );
  });
  it("should have a status of 422 and an appropriate message since the content and colour are not given in request body", async () => {
    const response = await request(app)
      .post("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ heading: "new test note" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("content")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour are not given in request body", async () => {
    const response = await request(app)
      .post("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ heading: "new test note", content: "sample content" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("colour")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour should be of length 7", async () => {
    const response = await request(app)
      .post("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "ssd",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("7 characters")
    );
  });
  it("should have a status of 404 and an appropriate message since the verse key is not valid", async () => {
    const response = await request(app)
      .post("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "#878787",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Ayah not found")
    );
  });

  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .post("/content/notes/1:2")
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
    const response = await request(app).post("/content/notes/1:2");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });

  it("should have a success property of true, status of 201 and a success message", async () => {
    const response = await request(app)
      .post("/content/notes/1:5")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "#878787",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });
});
//---------testing updating a note -------
describe("PUT /content/notes/:verse_key", () => {
  it("should have a status of 422 and an appropriate message since the heading, content and colour are not given in request body", async () => {
    const response = await request(app)
      .put("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("heading")
    );
  });
  it("should have a status of 422 and an appropriate message since the content and colour are not given in request body", async () => {
    const response = await request(app)
      .put("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ heading: "new test note" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("content")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour are not given in request body", async () => {
    const response = await request(app)
      .put("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ heading: "new test note", content: "sample content" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("colour")
    );
  });
  it("should have a status of 422 and an appropriate message since the colour should be of length 7", async () => {
    const response = await request(app)
      .put("/content/notes/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "ssd",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("7 characters")
    );
  });

  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .put("/content/notes/66fd08f80a8b917e9866beaa")
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
    const response = await request(app).put(
      "/content/notes/66fd08f80a8b917e9866beaa"
    );

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });

  it("should have a success property of false, status of 500 since the id is invalid", async () => {
    const response = await request(app)
      .put("/content/notes/66fd08f80a8b917e9866bddeaa")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "#878787",
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("success", false);
  });
  it("should have a success property of false since the note with the given id is already deleted", async () => {
    const response = await request(app)
      .put("/content/notes/66fd0fe5d687eaf858af33b6")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "#878787",
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("success", false);
  });
  it("should have a success property of true since the note with the given id and data is valid", async () => {
    const response = await request(app)
      .put("/content/notes/66fd159c894c1dc4095b46a1")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({
        heading: "new test note",
        content: "sample content",
        colour: "#878787",
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("success", false);
  });
});
//---------testing deleting notes-------
describe("DELETE /content/notes/", () => {
  it("should have a status of 200 and the deleted count should be 0, since no ids have been passed", async () => {
    const response = await request(app)
      .delete("/content/notes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("deletedCount", 0);
  });
  it("should have a status of 500 since one of the ids passed are invalid", async () => {
    const response = await request(app)
      .delete("/content/notes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        note_ids: ["66fd08f80a8b917e9866beaass"],
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("success", false);
  });
  it("should have a status of 200 and a deleted count of 1 since one id is passed", async () => {
    const response = await request(app)
      .delete("/content/notes/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({
        note_ids: ["66fd022497ee960de3d3a5fd"],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("deletedCount", 1);
  });
});
