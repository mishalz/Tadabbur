import "./helpers/env.js";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { decodeJwtPayload, validateNonce, extractUserFromIdToken } from "../components/auth/auth.service.js";

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = (payload) => `${b64({ alg: "none" })}.${b64(payload)}.signature`;

describe("decodeJwtPayload", () => {
  test("returns the payload claims", () => {
    assert.deepEqual(decodeJwtPayload(token({ sub: "u1", nonce: "n" })), { sub: "u1", nonce: "n" });
  });

  test("handles non-ASCII claims", () => {
    assert.equal(decodeJwtPayload(token({ name: "عبد الله" })).name, "عبد الله");
  });

  test("returns null for anything that is not a well-formed JWT", () => {
    for (const bad of [undefined, null, 42, "", "abc", "a.b", "a.b.c.d", `${b64({})}.!!!.sig`, `x.${b64([1, 2])}.y`, `x.${b64("text")}.y`, `x.${b64(null)}.y`]) {
      assert.equal(decodeJwtPayload(bad), null, String(bad));
    }
  });
});

describe("ID token helpers", () => {
  test("validateNonce compares against the stored nonce", () => {
    assert.equal(validateNonce(token({ nonce: "abc" }), "abc"), true);
    assert.equal(validateNonce(token({ nonce: "abc" }), "other"), false);
    assert.equal(validateNonce(token({}), "abc"), false);
    assert.equal(validateNonce("garbage", "abc"), false);
    assert.equal(validateNonce(token({ nonce: "abc" }), ""), false);
  });

  test("extractUserFromIdToken returns claims or null", () => {
    assert.equal(extractUserFromIdToken(token({ sub: "u1" })).sub, "u1");
    assert.equal(extractUserFromIdToken("garbage"), null);
    assert.equal(extractUserFromIdToken(undefined), null);
  });
});
