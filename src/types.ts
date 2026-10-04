export type Figure =
  | { type: 'numberLine'; parts: number; points: { tick: number; label: string }[] }
  | { type: 'graph'; points: [number, number][] };

export interface Option {
  t: string;
  ok?: boolean;
  /** Explication de l'erreur (darija) pour un mauvais choix */
  why?: string;
}

export interface Question {
  /** Numéro de la compétence, à partir de 1 */
  comp: number;
  q: string;
  options: Option[];
  hint: string;
  exp: string;
  fig: Figure | null;
  /** Question boss : un peu plus difficile, placée à la fin, bonus d'étoile */
  boss?: boolean;
}

export interface Competence {
  name: string;
  pages: string;
}

export interface Parcours {
  comps: Competence[];
  questions: Question[];
}

export interface Domain {
  id: string;
  name: string;
  ar: string;
  color: string;
  soft: string;
  parcours: Partial<Record<'1' | '2' | '3', Parcours>>;
}

export type Mood = '' | 'happy' | 'sad' | 'proud' | 'cheer';
