/**
 * BAC streams ("filières"). Centralized here so client components can import
 * the enum without dragging Mongoose into the browser bundle via the Exercise
 * model. The Exercise schema re-exports these constants for parity.
 */
export const FILIERE_KEYS = [
  'mathematiques',
  'sciences-experimentales',
  'lettres-philosophie',
  'langues-etrangeres',
  'gestion-economie',
  'mathematiques-techniques',
] as const;

export type FiliereKey = (typeof FILIERE_KEYS)[number];
