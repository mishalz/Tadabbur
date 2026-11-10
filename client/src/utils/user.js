/**
 * Display name for a user object (ID-token claims or a stored user).
 * Falls back through the claim names the identity provider may use and never
 * produces "undefined undefined".
 */
export const getFullName = (user) => {
  if (!user) return "User";
  const first = user.first_name ?? user.given_name;
  const last = user.last_name ?? user.family_name;
  return [first, last].filter(Boolean).join(" ") || user.name || "User";
};
