export const VISUAL_SECTIONS = ["home.board", "about.feature", "insights.hero"] as const;
export const VISUAL_MOTIONS = ["reveal", "float", "drift", "zoom", "static"] as const;

export type VisualSection = (typeof VISUAL_SECTIONS)[number];
export type VisualMotion = (typeof VISUAL_MOTIONS)[number];

export type PublicVisual = {
  id: string;
  imageUrl: string;
  alt: string;
  caption: string;
  motion: VisualMotion;
};
