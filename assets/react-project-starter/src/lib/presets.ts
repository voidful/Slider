import type { Theme, Venue } from "../types";

export const themeClassNames: Record<Theme, string> = {
  "zinc-editorial": "theme-zinc-editorial",
  "deep-navy-academic": "theme-deep-navy-academic",
  "monochrome-impeccable": "theme-monochrome-impeccable",
};

export const themeLabels: Record<Theme, string> = {
  "zinc-editorial": "Zinc editorial",
  "deep-navy-academic": "Deep navy academic",
  "monochrome-impeccable": "Monochrome impeccable",
};

export const venueLabels: Record<Venue, string> = {
  neurips: "NeurIPS style",
  iclr: "ICLR style",
  acl: "ACL style",
  cvpr: "CVPR style",
};
