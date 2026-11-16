import bcrypt from "bcryptjs";

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function passwordMatches(password, stored) {
  if (!stored || !String(stored).startsWith("$2")) return false;
  return bcrypt.compareSync(password, stored);
}
