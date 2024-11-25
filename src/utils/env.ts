/**
 * Custom error class for missing environment variables.
 */
class EnvNotFoundError extends Error {
  constructor(key: string) {
    super(`Could not find "${key}" environment variable`);
    this.name = "EnvNotFoundError";
  }
}

/**
 * Retrieves the value of an environment variable.
 * @param key - The key of the environment variable.
 * @returns The value of the environment variable.
 * @throws If the environment variable is not found.
 */
function get(key: string): string {
  const value = Bun.env[key];
  if (value === undefined) {
    throw new EnvNotFoundError(key);
  }
  return value;
}

/**
 * Retrieves the value of an environment variable, returning a fallback value or null if not found.
 * @param key - The key of the environment variable.
 * @param fallbackValue - The fallback value to return if the environment variable is not found.
 * @returns The value of the environment variable, the fallback value, or null.
 */
function getSafe(key: string, fallbackValue?: string): string | null {
  return Bun.env[key] ?? fallbackValue ?? null;
}

/**
 * Converts a string to a boolean.
 * @param value - The string value to convert.
 * @returns The boolean value.
 */
function parseBool(value: string): boolean {
  return (
    value.toLowerCase() === "true" ||
    value.toLowerCase() === "on" ||
    value.toLowerCase() === "yes" ||
    value === "1"
  );
}

/**
 * Retrieves the boolean value of an environment variable.
 * @param key - The key of the environment variable.
 * @returns The boolean value of the environment variable.
 * @throws If the environment variable is not found.
 */
function getBool(key: string): boolean {
  return parseBool(get(key));
}

/**
 * Retrieves the boolean value of an environment variable, returning a fallback value or null if not found.
 * @param key - The key of the environment variable.
 * @param fallbackValue - The fallback value to return if the environment variable is not found.
 * @returns The boolean value of the environment variable, the fallback value, or null.
 */
function getBoolSafe(key: string, fallbackValue: boolean): boolean;
function getBoolSafe(key: string, fallbackValue?: boolean): boolean | null;
function getBoolSafe(key: string, fallbackValue?: boolean): boolean | null {
  const value = Bun.env[key];
  if (value === undefined) {
    return fallbackValue ?? null;
  }
  return parseBool(value);
}

/**
 * Converts a string to an integer.
 * @param value - The string value to convert.
 * @param key - The key of the environment variable (for error message).
 * @returns The integer value.
 * @throws If the value is not a valid integer.
 */
function parseIntValue(value: string, key: string): number {
  const intValue = parseInt(value, 10);
  if (isNaN(intValue)) {
    throw new Error(`Environment variable "${key}" is not a valid integer`);
  }
  return intValue;
}

/**
 * Retrieves the integer value of an environment variable.
 * @param key - The key of the environment variable.
 * @returns The integer value of the environment variable.
 * @throws If the environment variable is not found or is not a valid integer.
 */
function getInt(key: string): number {
  return parseIntValue(get(key), key);
}

/**
 * Retrieves the integer value of an environment variable, returning a fallback value or null if not found or invalid.
 * @param key - The key of the environment variable.
 * @param fallbackValue - The fallback value to return if the environment variable is not found or invalid.
 * @returns The integer value of the environment variable, the fallback value, or null.
 */
function getIntSafe(key: string, fallbackValue: number): number;
function getIntSafe(key: string, fallbackValue?: number): number | null;
function getIntSafe(key: string, fallbackValue?: number): number | null {
  const value = Bun.env[key];
  if (value === undefined) {
    return fallbackValue ?? null;
  }
  try {
    return parseIntValue(value, key);
  } catch {
    return fallbackValue ?? null;
  }
}

export const env = {
  get,
  getSafe,
  getBool,
  getBoolSafe,
  getInt,
  getIntSafe,
};
