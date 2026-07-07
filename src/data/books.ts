export type Book = {
	title: string;
	author?: string;
	note?: string;
};

export type BookSection = {
	label: string;
	/** Series and author clusters render as one compact inline run. */
	inline?: boolean;
	/** Long inline runs span the full grid width on wider screens. */
	wide?: boolean;
	books: Book[];
};

export const bookSections: BookSection[] = [
	{
		label: "Robot · Asimov",
		inline: true,
		wide: true,
		books: [
			{ title: "I, Robot" },
			{ title: "The Caves of Steel" },
			{ title: "The Naked Sun" },
			{ title: "The Robots of Dawn" },
			{ title: "Robots and Empire" },
		],
	},
	{
		label: "Foundation · Asimov",
		inline: true,
		wide: true,
		books: [
			{ title: "Prelude to Foundation" },
			{ title: "Forward the Foundation" },
			{ title: "Foundation" },
			{ title: "Foundation and Empire" },
			{ title: "Second Foundation" },
			{ title: "Foundation's Edge" },
			{ title: "Foundation and Earth" },
		],
	},
	{
		label: "Carl Sagan",
		inline: true,
		wide: true,
		books: [
			{ title: "Cosmos" },
			{ title: "Contact" },
			{ title: "The Demon-Haunted World" },
			{ title: "The Dragons of Eden" },
		],
	},
	{
		label: "Andy Weir",
		inline: true,
		books: [
			{ title: "The Martian" },
			{ title: "Project Hail Mary" },
			{ title: "Artemis" },
		],
	},
	{
		label: "Andy Greenberg",
		inline: true,
		books: [
			{ title: "Sandworm" },
			{ title: "Tracers in the Dark" },
			{ title: "This Machine Kills Secrets" },
		],
	},
	{
		label: "Quanta · Thomas Lin",
		inline: true,
		books: [{ title: "Alice and Bob Meet the Wall of Fire" }],
	},
	{
		label: "Nicole Perlroth",
		inline: true,
		books: [{ title: "This Is How They Tell Me the World Ends" }],
	},
	{
		label: "John P. Carlin",
		inline: true,
		books: [{ title: "Dawn of the Code War" }],
	},
	{
		label: "Chris Miller",
		inline: true,
		books: [{ title: "Chip War" }],
	},
	{
		label: "Shiv Aroor & Rahul Singh",
		inline: true,
		books: [{ title: "India's Most Fearless" }],
	},
	{
		label: "Edward Snowden",
		inline: true,
		books: [{ title: "Permanent Record" }],
	},
	{
		label: "Steve Wozniak",
		inline: true,
		books: [{ title: "iWoz" }],
	},
	{
		label: "Jenson Button",
		inline: true,
		books: [
			{ title: "Life to the Limit" },
			{ title: "How to Be an F1 Driver" },
		],
	},
	{
		label: "Tim Marshall",
		inline: true,
		books: [{ title: "Worth Dying For" }],
	},
	{
		label: "Sun Tzu",
		inline: true,
		books: [{ title: "The Art of War" }],
	},
];
