export type Track = {
	title: string;
	artist: string;
	note?: string;
};

export type MusicSection = {
	label: string;
	tracks: Track[];
};

export const musicSections: MusicSection[] = [
	{
		label: "Instrumental",
		tracks: [
			{ title: "Pals", artist: "John Murphy", note: "28 Days Later" },
			{ title: "Experiences", artist: "Ludovico Einaudi" },
			{ title: "Time", artist: "Hans Zimmer", note: "Inception" },
			{ title: "God - Senna Theme", artist: "Antonio Pinto", note: "Senna" },
			{ title: "Can You Hear The Music", artist: "Ludwig Goransson", note: "Oppenheimer" },
			{ title: "Purpose Is Glorious", artist: "Natalie Holt", note: "Loki" },
			{ title: "Going The Distance", artist: "Bill Conti", note: "Rocky" },
			{ title: "Spring 1", artist: "Max Richter", note: "Vivaldi" },
			{ title: "Who You Really Are", artist: "David Arnold", note: "Sherlock" },
			{ title: "Darkstar", artist: "Harold Faltermeyer", note: "Top Gun: Maverick" },
			{
				title: "Main Titles (You've Been Called Back to Top Gun)",
				artist: "Harold Faltermeyer",
				note: "Top Gun: Maverick",
			},
			{ title: "MIA23 (1:2)", artist: "Charles Leclerc", note: "Accelerando" },
			{ title: "In the Hall Of The Mountain King", artist: "Edvard Grieg" },
			{ title: "Mission: Impossible Theme", artist: "Michael Giacchino" },
			{ title: "Brother Mine", artist: "David Arnold", note: "Sherlock" },
			{ title: "Special Ops Main Theme", artist: "Advait Nemlekar", note: "Special Ops" },
		],
	},
	{
		label: "English",
		tracks: [
			{ title: "Lonely Together", artist: "Avicii, Rita Ora" },
		],
	},
	{
		label: "Hindi",
		tracks: [
			{ title: "Banda (From \"Sam Bahadur\")", artist: "Shankar-Ehsaan-Loy", note: "Sam Bahadur" },
			{ title: "Bhaag Milkha Bhaag", artist: "Shankar Ehsaan Loy" },
			{ title: "Zinda", artist: "Shankar Ehsaan Loy" },
			{ title: "Besabriyaan", artist: "Armaan Malik", note: "M.S.Dhoni - The Untold Story" },
			{ title: "Jiyo Re Bahubali", artist: "Daler Mehndi, Ramya Behra, Sanjeev Chimmalgi" },
			{ title: "Bolo Na", artist: "Shaan", note: "12th Fail" },
		],
	},
];
