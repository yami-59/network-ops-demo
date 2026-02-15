import type { StatusCode } from "./types";

export function statusLabel(s: StatusCode) {
  switch (s) {
    case "PENDING":
      return "Créée";
    case "PLANNED":
      return "Planifiée";
    case "EXECUTED":
      return "Exécutée";
    case "FAILED":
      return "En échec";
    default:
      return String(s);
  }
}

export function statusColorScheme(s: StatusCode) {
  switch (s) {
    case "PENDING":
      return "gray";
    case "PLANNED":
      return "blue";
    case "EXECUTED":
      return "green";
    case "FAILED":
      return "red";
    default:
      return "gray";
  }
}

// backward-compatible alias (older files might import these)
export const statusColorSchemeLegacy = statusColorScheme;
