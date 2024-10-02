const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");

//---- testing user registration -----
describe("POST /auth/register", () => {
  it("should have a status of 422 and an appropriate message since the email is not valid", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "testuser", username: "sample", password: "password123" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("email")
    ); // Check if the message field is used and contains the word email
  });

  it("should return 422 and an appropriate message since password and email is missing", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ username: "" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("username")
    );
  });

  it("should have a status of 422 and an appropriate message  since the username is missing", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ email: "testuser", password: "password123" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("username")
    );
  });

  it("should return 404 if the url has an error", async () => {
    const response = await request(app)
      .post("/auth/registersd")
      .send({ username: "'" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 409 since email is already registered", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "mishal@gmail.com",
      username: "mishal",
      password: "mishal",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("registered")
    );
  });

  it("should return 201 and register user", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "zulfiqar01@gmail.com",
      username: "zulfiqar01",
      password: "zulfiqar01",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("success", true);
  });
});
//---- testing user login -----
describe("POST /auth/login", () => {
  it("should have a status of 422 and an appropriate message since the email is not valid", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "testuser", password: "password123" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("email")
    ); // Check if the message field is used and contains the word email
  });

  it("should return 422 and an appropriate message since password is missing", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "zulfi@gmail.com" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("password")
    );
  });

  it("should have a status of 422 and an appropriate message since the email is missing", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ password: "password123" });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("email")
    );
  });

  it("should return 404 if the url has an error", async () => {
    const response = await request(app)
      .post("/auth/login/3132")
      .send({ username: "'" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 409 and an appropriate message since email is not registered", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "wow@gmail.com",
      password: "wow",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("registered")
    );
  });

  it("should return 401 since the password is incorrect", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "ulfi@gmail.com",
      password: "zulfiyes",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("password is incorrect")
    );
  });
});
//---- testing user valid route -----
describe("POST /auth/validate", () => {
  it("should return 200 since the token is attached and valid", async () => {
    const response = await request(app)
      .get("/auth/validate")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjkzMzNlMDgxNmVmOWIxMGE5NWM1OCIsInVzZXJuYW1lIjoic2FieSIsImlhdCI6MTcyNzYxMTA2NCwiZXhwIjoxNzI4MjE1ODY0fQ.xU0qowOXhPp3wxEfzuTiacN9p900A5c9uOsVn8Iuaqw"
      );
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("user");
  });
  it("should return 401 since the token is missing", async () => {
    const response = await request(app).get("/auth/validate");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("token is missing")
    );
  });
  it("should return 401 since the token is invalid", async () => {
    const response = await request(app)
      .get("/auth/validate")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVsCJ9.eyJpZCI6IjY2ZjkzMzNlMDgxNmVmOWIxMGE5NWM1OCIsInVzZXJuYW1lIjoic2FieSIsImlhdCI6MTcyNzYxMTA2NCwiZXhwIjoxNzI4MjE1ODY0fQ.xU0qowOXhPp3wxEfzuTiacN9p900A5c9uOsVn8Iuaqw"
      );

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body).toHaveProperty(
      "message",
      expect.stringMatching("token is invalid")
    );
  });
});
