const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");

//---------testing all bookmarks retrieval -------
describe("GET /content/conenctions", () => {
  it("should have a status of 401 and an appropriate message since the token is missing", async () => {
    const response = await request(app).get("/content/bookmarks");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });
  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .get("/content/bookmarks")
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

  it("should have a success property of true and an appropriate message since the user has no bookmarks currently", async () => {
    const response = await request(app)
      .get("/content/bookmarks")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODFkZWRkNjQwNDlmYTRiNDhlOCIsInVzZXJuYW1lIjoibWF0ZWVuIiwiaWF0IjoxNzI3ODY4NjgyLCJleHAiOjE3Mjg0NzM0ODJ9.pA1JcMSX2qMF7fVi_iuVxhFvXiMY9e8lf5E8o1u3-nc"
      );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("no bookmarks")
    );
  });

  it("should have a success property of true, status of 200 and a bookmarks array", async () => {
    const response = await request(app)
      .get("/content/bookmarks")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmFjYTQ3MGQzNTUyYTI2YThiYTU1NCIsInVzZXJuYW1lIjoiYW5udXMiLCJpYXQiOjE3Mjc4NjgwNjUsImV4cCI6MTcyODQ3Mjg2NX0.H_Bqc5A2YSD0YSLIKzufsYU2MemJZKR26FFVoKb0m4E"
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("bookmarks");
  });
});

//---------testing adding a bookmark -------
describe("POST /content/connections/", () => {
  it("should have a status of 404 and an appropriate message since the verse key given to be bookmarked is invalid", async () => {
    const response = await request(app)
      .post("/content/bookmarks")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmQwNWQzZWI0NWY3MTE1MTk4NWRjOCIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTgxNDQsImV4cCI6MTcyODQ2Mjk0NH0.342b8Cm0MqJP1CWaJLFw4F_sjK5rkpaDwqaCNTxuMN0"
      )
      .send({ verse_key: "3:4099" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("Ayah not found")
    );
  });

  it("should have a status of 401 and an appropriate message since the token is invalid", async () => {
    const response = await request(app)
      .post("/content/bookmarks")
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
    const response = await request(app).post("/content/bookmarks");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("missing")
    );
  });

  it("should have a success property of true, status of 201 and bookmark should be added successfully", async () => {
    const response = await request(app)
      .post("/content/bookmarks")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmNmODdjNTJhMjRjNGVkMTJkMmMxOSIsInVzZXJuYW1lIjoienVsZmkiLCJpYXQiOjE3Mjc4NTY3OTAsImV4cCI6MTcyODQ2MTU5MH0.72PdEmmo2dLerSZcgd89cdJC59MBq8esn_Taldczw0Q"
      )
      .send({ verse_key: "3:4" });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });
});
