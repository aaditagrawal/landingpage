export type Book = {
	title: string;
	author: string;
	note?: string;
};

export type BookSection = {
	label: string;
	books: Book[];
};

export const bookSections: BookSection[] = [
	{
		label: "Robot · Asimov",
		books: [
			{ title: "I, Robot", author: "Isaac Asimov" },
			{ title: "The Caves of Steel", author: "Isaac Asimov" },
			{ title: "The Naked Sun", author: "Isaac Asimov" },
			{ title: "The Robots of Dawn", author: "Isaac Asimov" },
			{ title: "Robots and Empire", author: "Isaac Asimov" },
		],
	},
	{
		label: "Foundation · Asimov",
		books: [
			{ title: "Prelude to Foundation", author: "Isaac Asimov" },
			{ title: "Forward the Foundation", author: "Isaac Asimov" },
			{ title: "Foundation", author: "Isaac Asimov" },
			{ title: "Foundation and Empire", author: "Isaac Asimov" },
			{ title: "Second Foundation", author: "Isaac Asimov" },
			{ title: "Foundation's Edge", author: "Isaac Asimov" },
			{ title: "Foundation and Earth", author: "Isaac Asimov" },
		],
	},
	{
		label: "Also",
		books: [
			{ title: "Cosmos", author: "Carl Sagan" },
			{ title: "Contact", author: "Carl Sagan" },
			{ title: "The Martian", author: "Andy Weir" },
			{ title: "Project Hail Mary", author: "Andy Weir" },
			{ title: "Artemis", author: "Andy Weir" },
		],
	},
];
