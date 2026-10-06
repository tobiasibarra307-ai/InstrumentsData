export function normalizeOptionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildInstrumentPayload(formData) {
  return {
    userName: normalizeOptionalText(String(formData.get("userName") ?? "")),
    instrument: normalizeOptionalText(String(formData.get("instrument") ?? "")),
    partNumber: normalizeOptionalText(String(formData.get("partNumber") ?? "")),
    serialNumber: normalizeOptionalText(String(formData.get("serialNumber") ?? "")),
    photo: formData.get("photo"),
  };
}
