export function isValidPublicIp(value) {
  if (typeof value !== "string" || value.length < 2 || value.length > 45 || !/^[0-9a-fA-F:.]+$/.test(value)) return false;
  if (value.includes(".")) {
    const parts = value.split(".");
    return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  }
  return value.includes(":") && value.split(":").length >= 3;
}

export function buildInvitationLink(baseUrl, room, token, { includeIp = false, publicIp = "" } = {}) {
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(String(room))) throw new TypeError("Invalid room name");
  if (typeof token !== "string" || token.length < 8 || token.length > 2048) throw new TypeError("A valid invitation token is required");
  if (includeIp && !isValidPublicIp(publicIp)) throw new TypeError("Check a valid public IP before including it");
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", room);
  url.searchParams.set("invite", token);
  if (includeIp) url.hash = new URLSearchParams({ "shared-ip": publicIp }).toString();
  return url.toString();
}
