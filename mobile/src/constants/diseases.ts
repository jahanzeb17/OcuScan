export type DiseaseId =
  | "conjunctivitis"
  | "pterygium"
  | "strabismus";

export interface Disease {
  id: DiseaseId;
  name: string;
  count: number;
  subtypes: string[];
}

export const DISEASES: Disease[] = [
  {
    id: "conjunctivitis",
    name: "Conjunctivitis",
    count: 248,
    subtypes: [
      "Bacterial conjunctivitis",
      "Allergic conjunctivitis",
      "Viral conjunctivitis",
    ],
  },
  {
    id: "pterygium",
    name: "Pterygium",
    count: 176,
    subtypes: [
      "Pterygium subtype 1",
      "Pterygium subtype 2",
      "Pterygium subtype 3",
    ],
  },
  {
    id: "strabismus",
    name: "Strabismus",
    count: 132,
    subtypes: [
      "Strabismus subtype 1",
      "Strabismus subtype 2",
      "Strabismus subtype 3",
    ],
  },
];