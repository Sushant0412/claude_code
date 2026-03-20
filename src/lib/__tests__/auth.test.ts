// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ──────────────────────────────────────────────
// Mock "server-only" so importing auth.ts doesn't throw in a test env.
// ──────────────────────────────────────────────
vi.mock("server-only", () => ({}));

import * as jose from "jose";

// ──────────────────────────────────────────────
// Cookie store mock – mirrors the Next.js cookies() shape.
// ──────────────────────────────────────────────
const cookieStore = {
  _jar: new Map<string, string>(),
  get(name: string) {
    const value = this._jar.get(name);
    return value !== undefined ? { value } : undefined;
  },
  set(name: string, value: string) {
    this._jar.set(name, value);
  },
  delete(name: string) {
    this._jar.delete(name);
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

// ──────────────────────────────────────────────
// Import the module under test AFTER mocks are registered.
// ──────────────────────────────────────────────
import {
  createSession,
  getSession,
  deleteSession,
  verifySession,
  type SessionPayload,
} from "@/lib/auth";
import { NextRequest } from "next/server";

// ──────────────────────────────────────────────
// Shared JWT secret (must match auth.ts fallback)
// ──────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

// ──────────────────────────────────────────────
// Helper – mint a real signed JWT with the given payload.
// ──────────────────────────────────────────────
async function mintToken(payload: Record<string, unknown>, expiresIn = "7d") {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// ──────────────────────────────────────────────
// Helper – build a NextRequest with an optional cookie value.
// ──────────────────────────────────────────────
function makeRequest(cookieValue?: string): NextRequest {
  const req = new NextRequest("http://localhost/");
  if (cookieValue) {
    Object.defineProperty(req, "cookies", {
      get: () => ({
        get: (name: string) =>
          name === COOKIE_NAME ? { value: cookieValue } : undefined,
      }),
    });
  }
  return req;
}

// Reset the in-memory cookie jar before each test.
beforeEach(() => {
  cookieStore._jar.clear();
});

// ══════════════════════════════════════════════
// createSession
// ══════════════════════════════════════════════
describe("createSession", () => {
  it("sets an auth-token cookie in the cookie store", async () => {
    await createSession("user-1", "alice@example.com");

    const stored = cookieStore._jar.get(COOKIE_NAME);
    expect(stored).toBeDefined();
    expect(typeof stored).toBe("string");
  });

  it("stores a valid, verifiable JWT", async () => {
    await createSession("user-42", "bob@example.com");

    const token = cookieStore._jar.get(COOKIE_NAME)!;
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("bob@example.com");
  });

  it("the JWT expires roughly 7 days from now", async () => {
    const before = Math.floor(Date.now() / 1000);
    await createSession("user-1", "test@example.com");
    const after = Math.floor(Date.now() / 1000);

    const token = cookieStore._jar.get(COOKIE_NAME)!;
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDaysInSeconds - 5);
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDaysInSeconds + 5);
  });

  it("overwrites a previous session token", async () => {
    await createSession("user-1", "first@example.com");
    const firstToken = cookieStore._jar.get(COOKIE_NAME);

    await createSession("user-2", "second@example.com");
    const secondToken = cookieStore._jar.get(COOKIE_NAME);

    expect(secondToken).not.toEqual(firstToken);

    const { payload } = await jose.jwtVerify(secondToken!, JWT_SECRET);
    expect(payload.email).toBe("second@example.com");
  });
});

// ══════════════════════════════════════════════
// getSession
// ══════════════════════════════════════════════
describe("getSession", () => {
  it("returns null when no cookie is present", async () => {
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns the session payload for a valid token", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const payload: SessionPayload = {
      userId: "user-99",
      email: "charlie@example.com",
      expiresAt,
    };
    const token = await mintToken({ ...payload });
    cookieStore._jar.set(COOKIE_NAME, token);

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-99");
    expect(session!.email).toBe("charlie@example.com");
  });

  it("returns null for an expired token", async () => {
    const token = await mintToken({ userId: "x", email: "x@x.com" }, "-1s");
    cookieStore._jar.set(COOKIE_NAME, token);

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns null for a tampered / invalid token", async () => {
    cookieStore._jar.set(COOKIE_NAME, "this.is.not.a.valid.jwt");

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const token = await new jose.SignJWT({ userId: "u", email: "u@u.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(wrongSecret);

    cookieStore._jar.set(COOKIE_NAME, token);

    const session = await getSession();
    expect(session).toBeNull();
  });
});

// ══════════════════════════════════════════════
// deleteSession
// ══════════════════════════════════════════════
describe("deleteSession", () => {
  it("removes the auth-token cookie", async () => {
    cookieStore._jar.set(COOKIE_NAME, "some-token");
    expect(cookieStore._jar.has(COOKIE_NAME)).toBe(true);

    await deleteSession();

    expect(cookieStore._jar.has(COOKIE_NAME)).toBe(false);
  });

  it("does not throw when there is no cookie to delete", async () => {
    await expect(deleteSession()).resolves.not.toThrow();
  });
});

// ══════════════════════════════════════════════
// verifySession
// ══════════════════════════════════════════════
describe("verifySession", () => {
  it("returns null when the request has no auth-token cookie", async () => {
    const req = makeRequest();
    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  it("returns the session payload for a valid token in the request cookie", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const payload: SessionPayload = {
      userId: "user-77",
      email: "dave@example.com",
      expiresAt,
    };
    const token = await mintToken({ ...payload });
    const req = makeRequest(token);

    const session = await verifySession(req);

    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-77");
    expect(session!.email).toBe("dave@example.com");
  });

  it("returns null for an expired token in the request", async () => {
    const token = await mintToken({ userId: "y", email: "y@y.com" }, "-1s");
    const req = makeRequest(token);

    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  it("returns null for a malformed token in the request", async () => {
    const req = makeRequest("bad.token.value");
    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  it("returns null for a token signed with a wrong secret", async () => {
    const wrongSecret = new TextEncoder().encode("another-wrong-secret");
    const token = await new jose.SignJWT({ userId: "z", email: "z@z.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(wrongSecret);

    const req = makeRequest(token);
    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  it("reads only from the request object, not the server cookie store", async () => {
    cookieStore._jar.set(COOKIE_NAME, "unrelated-cookie-value");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await mintToken({
      userId: "req-user",
      email: "req@example.com",
      expiresAt,
    });
    const req = makeRequest(token);

    const session = await verifySession(req);
    expect(session!.userId).toBe("req-user");
  });
});
