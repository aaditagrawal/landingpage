export type MediaEntry = {
  title: string;
  year?: number;
};

export type MediaSection = {
  label: string;
  items: MediaEntry[];
};

/** Curated for craft and vision, drawn from the Jellyfin library, not watch counts. */
export const mediaSections: MediaSection[] = [
  {
    label: "Films",
    items: [
      { title: "My Neighbor Totoro", year: 1988 },
      { title: "Schindler's List", year: 1993 },
      { title: "Memento", year: 2000 },
      { title: "No Country for Old Men", year: 2007 },
      { title: "Like Stars on Earth", year: 2007 },
      { title: "The Social Network", year: 2010 },
      { title: "Her", year: 2013 },
      { title: "The Imitation Game", year: 2014 },
      { title: "Ex Machina", year: 2015 },
      { title: "Coco", year: 2017 },
      { title: "The Lighthouse", year: 2019 },
      { title: "Midsommar", year: 2019 },
      { title: "Another Round", year: 2020 },
      { title: "Dune", year: 2021 },
      { title: "All Quiet on the Western Front", year: 2022 },
      { title: "The Banshees of Inisherin", year: 2022 },
      { title: "Oppenheimer", year: 2023 },
      { title: "Spider-Man: Across the Spider-Verse", year: 2023 },
      { title: "Flow", year: 2024 },
    ],
  },
  {
    label: "Series",
    items: [
      { title: "Cosmos: A Personal Voyage", year: 1980 },
      { title: "Sherlock", year: 2010 },
      { title: "Mr. Robot", year: 2015 },
      { title: "Scam 1992", year: 2020 },
      { title: "Arcane", year: 2021 },
      { title: "Foundation", year: 2021 },
      { title: "Pantheon", year: 2022 },
    ],
  },
];
