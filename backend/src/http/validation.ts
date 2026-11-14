import { ApiError } from "./errors.js";

export interface IntegerOptions {
  required?: boolean;
  defaultValue?: number;
  min?: number;
  max?: number;
}

export function parseInteger(value: unknown, name: string, options: IntegerOptions = {}): number | null {
  if (value === undefined || value === null || value === "") {
    if (options.required) throw new ApiError(400, "INVALID_PARAMETER", `Falta el parámetro ${name}.`, { parameter: name });
    return options.defaultValue ?? null;
  }
  if (Array.isArray(value)) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser un entero.`, { parameter: name });
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser un entero.`, { parameter: name, value });
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser >= ${options.min}.`, { parameter: name, value: parsed });
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser <= ${options.max}.`, { parameter: name, value: parsed });
  }
  return parsed;
}

export function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  throw new ApiError(400, "INVALID_PARAMETER", "El parámetro booleano es inválido.", { value });
}

export function parseCsvIntegers(value: unknown, name: string, options: { required?: boolean; minItems?: number; maxItems?: number; min?: number; max?: number } = {}): number[] {
  if (value === undefined || value === null || value === "") {
    if (options.required) throw new ApiError(400, "INVALID_PARAMETER", `Falta el parámetro ${name}.`, { parameter: name });
    return [];
  }
  if (typeof value !== "string") {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser una lista CSV.`, { parameter: name });
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (options.minItems !== undefined && items.length < options.minItems) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} requiere al menos ${options.minItems} valores.`, { parameter: name });
  }
  if (options.maxItems !== undefined && items.length > options.maxItems) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} admite hasta ${options.maxItems} valores.`, { parameter: name });
  }
  const parsed = items.map((item) => {
    const number = Number(item);
    if (!Number.isInteger(number)) {
      throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} contiene un entero inválido.`, { parameter: name, value: item });
    }
    if (options.min !== undefined && number < options.min) {
      throw new ApiError(400, "INVALID_PARAMETER", `Uno de los valores de ${name} está fuera de rango.`, { parameter: name, value: number });
    }
    if (options.max !== undefined && number > options.max) {
      throw new ApiError(400, "INVALID_PARAMETER", `Uno de los valores de ${name} está fuera de rango.`, { parameter: name, value: number });
    }
    return number;
  });
  const unique = [...new Set(parsed)];
  if (options.minItems !== undefined && unique.length < options.minItems) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} requiere al menos ${options.minItems} valores distintos.`, { parameter: name });
  }
  if (options.maxItems !== undefined && unique.length > options.maxItems) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} admite hasta ${options.maxItems} valores.`, { parameter: name });
  }
  return unique;
}

export function parseCsvStrings(value: unknown, name: string, allowed?: readonly string[]): string[] | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} debe ser una lista CSV.`, { parameter: name });
  }
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowed) {
    const invalid = items.filter((item) => !allowed.includes(item));
    if (invalid.length > 0) {
      throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} contiene valores no permitidos.`, {
        parameter: name,
        invalid,
        allowed,
      });
    }
  }
  return items;
}

export function parseEnum<T extends string>(value: unknown, name: string, allowed: readonly T[], defaultValue: T): T {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(400, "INVALID_PARAMETER", `El parámetro ${name} no es válido.`, { parameter: name, value, allowed });
  }
  return value as T;
}

export function currentYear(): number {
  return new Date().getFullYear();
}
