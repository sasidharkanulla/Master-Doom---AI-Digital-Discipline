import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccessDeadline } from "./accessDeadline.ts";

test("honors the approved duration and expires exactly at its boundary", () => {
  const deadline = createAccessDeadline(180, 1000);
  assert.deepEqual(deadline.read(1000), { remainingSeconds: 180, expired: false });
  assert.deepEqual(deadline.read(180999), { remainingSeconds: 1, expired: false });
  assert.deepEqual(deadline.read(181000), { remainingSeconds: 0, expired: true });
});

test("delayed background callbacks cannot extend access", () => {
  const deadline = createAccessDeadline(120, 0);
  assert.deepEqual(deadline.read(300000), { remainingSeconds: 0, expired: true });
});

test("invalid and non-positive grants fail closed", () => {
  for (const grant of [NaN, Infinity, -1, 0]) {
    assert.equal(createAccessDeadline(grant, 1000).read(1000).expired, true);
  }
});

test("caps grants at the existing 600-second policy maximum", () => {
  assert.equal(createAccessDeadline(9999, 0).read(0).remainingSeconds, 600);
});

test("a new session gets a fresh deadline without changing the old session", () => {
  const first = createAccessDeadline(120, 0);
  const second = createAccessDeadline(300, 120000);
  assert.equal(first.read(120000).expired, true);
  assert.equal(second.read(120000).remainingSeconds, 300);
});
