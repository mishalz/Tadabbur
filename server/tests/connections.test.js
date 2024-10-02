const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");

//---------testing all connections retrieval -------
describe("GET /content/conenctions", () => {
  it("should have a status of 401 and an appropriate message since the token is missing", async () => {
    const response = await request(app).get("/content/connections");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/connections")
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

  it("should have a success property of true and an appropriate message since the user has no connections currently", async () => {
    const response = await request(app)
      .get("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmFjYTQ3MGQzNTUyYTI2YThiYTU1NCIsInVzZXJuYW1lIjoiYW5udXMiLCJpYXQiOjE3Mjc4NjgwNjUsImV4cCI6MTcyODQ3Mjg2NX0.H_Bqc5A2YSD0YSLIKzufsYU2MemJZKR26FFVoKb0m4E"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no connections")
    );
  });

  it("should have a success property of true, status of 200 and a connections array", async () => {
    const response = await request(app)
      .get("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjkzMzNlMDgxNmVmOWIxMGE5NWM1OCIsInVzZXJuYW1lIjoic2FieSIsImlhdCI6MTcyNzg2NjQ3NywiZXhwIjoxNzI4NDcxMjc3fQ.hJTQTZ4l_WTLGIb4GHEsYvP5tj8MUUsYBTfgcp_tpSw"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("connections");
  });
});

//---------testing connections retrieval for a specific verse -------
describe("GET /content/connections/:verse_key", () => {
  it("should have a status of 404 and an appropriate message since the verse key is invalid", async () => {
    const response = await request(app)
      .get("/content/connections/123")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/connections/1:2")
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

  it("should have a success property of true and an appropriate message since the user has no connections currently", async () => {
    const response = await request(app)
      .get("/content/connections/2:78")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no connections")
    );
  });

  it("should have a success property of true, status of 200 and a connections array", async () => {
    const response = await request(app)
      .get("/content/connections/9:4")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjkzMzNlMDgxNmVmOWIxMGE5NWM1OCIsInVzZXJuYW1lIjoic2FieSIsImlhdCI6MTcyNzg2NjQ3NywiZXhwIjoxNzI4NDcxMjc3fQ.hJTQTZ4l_WTLGIb4GHEsYvP5tj8MUUsYBTfgcp_tpSw"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("connections");
  });
});

//---------testing creating a note -------
describe("POST /content/connections/", () => {
  it("should have a status of 422 and an appropriate message since the from and to verse are not defined", async () => {
    const response = await request(app)
      .post("/content/connections/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({});

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("fromVerse")
    );
  });
  it("should have a status of 422 and an appropriate message since the format of the from verse should be like 'surahnumber':'versenumber'", async () => {
    const response = await request(app)
      .post("/content/connections/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ fromVerse: "1" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("fromVerse")
    );
  });

  it("should have a status of 422 and an appropriate message since the format of the to verse should be like 'surahnumber':'versenumber'", async () => {
    const response = await request(app)
      .post("/content/connections/")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ fromVerse: "1:2", toVerse: "9" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("toVerse")
    );
  });

  it("should have a status of 422 and an appropriate message since is displayed since teh note can not be empty", async () => {
    const response = await request(app)
      .post("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ fromVerse: "1:2", toVerse: "9:3", note: "" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("note")
    );
  });
  it("should have a status of 404 and an appropriate message since one or both verse keys given in the body are invalid", async () => {
    const response = await request(app)
      .post("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ fromVerse: "1:3232", toVerse: "9:3", note: "sample note" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("ayah")
    );
  });

  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .post("/content/connections")
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
    const response = await request(app).post("/content/connections");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });

  it("should have a success property of false, status of 400 and a message saying that the connection already exists", async () => {
    const response = await request(app)
      .post("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({ fromVerse: "7:54", toVerse: "9:3", note: "sample note" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("connection exists")
    );
  });
  it("should have a success property of true, status of 201 and connection should be created successfully", async () => {
    const response = await request(app)
      .post("/content/connections")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({ fromVerse: "7:8", toVerse: "9:24", note: "sample note" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });
});
