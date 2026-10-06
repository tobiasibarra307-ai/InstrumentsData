import test from "node:test";
import assert from "node:assert/strict";
import { buildInstrumentPayload } from "./instrumentForm.mjs";

test("buildInstrumentPayload acepta campos vacíos", () => {
  const formData = new FormData();
  const payload = buildInstrumentPayload(formData);

  assert.equal(payload.userName, "");
  assert.equal(payload.instrument, "");
  assert.equal(payload.partNumber, "");
  assert.equal(payload.serialNumber, "");
  assert.equal(payload.photo, null);
});
