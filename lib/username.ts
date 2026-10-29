export const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,24}$/;

export function validateUsername(value: string) {
  const username = value.trim();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      "Use 3–24 letters, numbers, underscores or hyphens for your username.",
    );
  }
  return username;
}

export function displayUsername(metadata: Record<string, unknown> | undefined) {
  const value = metadata?.username;
  return typeof value === "string" && USERNAME_PATTERN.test(value.trim())
    ? value.trim()
    : null;
}
