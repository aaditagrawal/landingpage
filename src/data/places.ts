export type Place = {
	/** Stable key for the marker. */
	id: string;
	/** Label shown on the place card. */
	name: string;
	lat: number;
	lng: number;
	/** Short line on the card. */
	note?: string;
	/** Slightly larger marker on the map. */
	home?: boolean;
};

export const places: Place[] = [
	{ id: "delhi", name: "Delhi", lat: 28.6139, lng: 77.209 },
	{ id: "dehradun", name: "Dehradun", lat: 30.3165, lng: 78.0322 },
	{ id: "mussoorie", name: "Mussoorie", lat: 30.4598, lng: 78.0644 },
	{ id: "nainital", name: "Nainital", lat: 29.391, lng: 79.454 },
	{ id: "amritsar", name: "Amritsar", lat: 31.634, lng: 74.8723 },
	{ id: "suryamala", name: "Suryamala", lat: 19.7587, lng: 73.3475 },
	{ id: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867 },
	{ id: "goa", name: "Goa", lat: 15.4909, lng: 73.8278 },
	{ id: "mangalore", name: "Mangalore", lat: 12.9141, lng: 74.856 },
	{ id: "manipal", name: "Manipal", lat: 13.352, lng: 74.786 },
	{ id: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946, home: true, note: "home" },
	{ id: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707 },
	{ id: "pondicherry", name: "Pondicherry", lat: 11.9416, lng: 79.8083 },
	{ id: "ezhimala", name: "Ezhimala", lat: 11.984, lng: 75.21 },
	{ id: "karwar", name: "Karwar", lat: 14.8137, lng: 74.1299 },
];
