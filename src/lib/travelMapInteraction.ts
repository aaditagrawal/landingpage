import type { Place } from "../data/places";

type Transform = { k: number; tx: number; ty: number };

const TAP_SLOP_PX = 6;
const INTRO_MS = 1100;

type Point = { x: number; y: number };

function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

function parseTransforms(svg: SVGSVGElement): { global: Transform; home: Transform } {
	const fallback = { global: { k: 1, tx: 0, ty: 0 }, home: { k: 1, tx: 0, ty: 0 } };
	const raw = svg.dataset.mapTransforms;
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as { global: Transform; home: Transform };
	} catch {
		return fallback;
	}
}

function animateTransform(
	from: Transform,
	to: Transform,
	duration: number,
	onUpdate: (t: Transform) => void,
	onDone?: () => void,
): void {
	const start = performance.now();
	const step = (now: number) => {
		const t = Math.min(1, (now - start) / duration);
		const e = easeOutCubic(t);
		onUpdate({
			k: from.k + (to.k - from.k) * e,
			tx: from.tx + (to.tx - from.tx) * e,
			ty: from.ty + (to.ty - from.ty) * e,
		});
		if (t < 1) requestAnimationFrame(step);
		else onDone?.();
	};
	requestAnimationFrame(step);
}

function clientToViewBox(client: Point, rect: DOMRect, vbW: number, vbH: number): Point {
	return {
		x: ((client.x - rect.left) / rect.width) * vbW,
		y: ((client.y - rect.top) / rect.height) * vbH,
	};
}

function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function formatCoords(lat: number, lng: number): string {
	const latDir = lat >= 0 ? "N" : "S";
	const lngDir = lng >= 0 ? "E" : "W";
	return `${Math.abs(lat).toFixed(2)}° ${latDir} · ${Math.abs(lng).toFixed(2)}° ${lngDir}`;
}

export function initTravelMaps(places: Place[]): void {
	document.querySelectorAll<HTMLElement>("[data-travel-map]").forEach((root) => {
		if (root.dataset.wired === "true") return;
		root.dataset.wired = "true";
		wireTravelMap(root, places);
	});
}

function wireTravelMap(root: HTMLElement, places: Place[]): void {
	const svg = root.querySelector<SVGSVGElement>(".travel-map__chart svg");
	const layer = svg?.querySelector<SVGGElement>(".travel-zoom-layer");
	const chart = root.querySelector<HTMLElement>(".travel-map__chart");
	const card = document.querySelector<HTMLElement>("[data-place-card]");
	const eyebrow = document.querySelector<HTMLElement>("[data-place-eyebrow]");
	const nameEl = document.querySelector<HTMLElement>("[data-place-name]");
	const coordsEl = document.querySelector<HTMLElement>("[data-place-coords]");
	const noteEl = document.querySelector<HTMLElement>("[data-place-note]");

	if (!svg || !layer || !chart || !card || !eyebrow || !nameEl || !coordsEl || !noteEl) return;

	if (card.parentElement !== document.body) document.body.appendChild(card);

	const vbW = Number(svg.dataset.vbW ?? 960);
	const vbH = Number(svg.dataset.vbH ?? 520);
	const { global: globalTransform, home: homeTransform } = parseTransforms(svg);
	const minScale = homeTransform.k;
	const maxScale = homeTransform.k * 24;

	const placeById = new Map(places.map((place) => [place.id, place]));
	let transform: Transform = { ...globalTransform };
	let activeMarker: SVGGElement | null = null;
	let isDragging = false;
	let isIntro = true;

	const pointers = new Map<number, Point>();
	let pinch: {
		startDist: number;
		startK: number;
		startMidVB: Point;
		startTx: number;
		startTy: number;
	} | null = null;
	let pan: { pointerId: number; startX: number; startY: number; startTx: number; startTy: number } | null = null;

	const clampScale = (k: number) => Math.min(maxScale, Math.max(minScale, k));

	const clampTransform = (next: Transform): Transform => {
		const k = clampScale(next.k);
		const minTx = vbW * (1 - k);
		const minTy = vbH * (1 - k);
		return {
			k,
			tx: Math.min(0, Math.max(minTx, next.tx)),
			ty: Math.min(0, Math.max(minTy, next.ty)),
		};
	};

	const applyTransform = () => {
		layer.setAttribute("transform", `translate(${transform.tx} ${transform.ty}) scale(${transform.k})`);
		const markerScale = Math.min(1, homeTransform.k / transform.k);
		root.querySelectorAll<SVGCircleElement>(".travel-marker circle[data-base-r]").forEach((circle) => {
			const baseR = Number(circle.dataset.baseR);
			if (Number.isFinite(baseR)) circle.setAttribute("r", String(baseR * markerScale));
		});
		if (activeMarker) positionCard(activeMarker);
	};

	const setTransform = (next: Transform, skipClamp = false) => {
		transform = skipClamp ? next : clampTransform(next);
		applyTransform();
	};

	const runIntro = () => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduced) {
			setTransform({ ...homeTransform });
			isIntro = false;
			return;
		}

		setTransform({ ...globalTransform }, true);
		window.setTimeout(() => {
			animateTransform(
				globalTransform,
				homeTransform,
				INTRO_MS,
				(t) => setTransform(t, true),
				() => {
					setTransform({ ...homeTransform });
					isIntro = false;
				},
			);
		}, 120);
	};

	const setActiveMarker = (marker: SVGGElement | null) => {
		root.querySelectorAll(".travel-marker").forEach((node) => {
			node.classList.toggle("is-active", node === marker);
		});
		if (marker) marker.parentElement?.appendChild(marker);
		activeMarker = marker;
	};

	const positionCard = (marker: SVGGElement) => {
		const anchor = marker.querySelector<SVGCircleElement>(".travel-hit, .travel-dot");
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		const cardH = card.offsetHeight || 88;
		const cardW = card.offsetWidth || 180;
		const margin = 12;

		let left = rect.left + rect.width / 2;
		let top = rect.top - margin;

		left = Math.min(Math.max(left, margin + cardW / 2), window.innerWidth - margin - cardW / 2);
		if (top - cardH < margin) top = rect.bottom + margin + cardH;

		card.style.left = `${left}px`;
		card.style.top = `${top}px`;
	};

	const showCard = (id: string, marker: SVGGElement) => {
		if (isDragging) return;
		const place = placeById.get(id);
		if (!place) return;

		setActiveMarker(marker);
		eyebrow.textContent = place.home ? "home" : "place";
		nameEl.textContent = place.name;
		coordsEl.textContent = formatCoords(place.lat, place.lng);

		if (place.note) {
			noteEl.textContent = place.note;
			noteEl.hidden = false;
		} else {
			noteEl.textContent = "";
			noteEl.hidden = true;
		}

		card.setAttribute("aria-hidden", "false");
		card.classList.add("is-visible");
		positionCard(marker);
	};

	const hideCard = () => {
		setActiveMarker(null);
		card.classList.remove("is-visible");
		card.setAttribute("aria-hidden", "true");
		card.style.left = "-9999px";
		card.style.top = "-9999px";
	};

	const markerFromEvent = (event: Event): SVGGElement | null => {
		if (!(event.target instanceof Element)) return null;
		const marker = event.target.closest<SVGGElement>(".travel-marker");
		return marker && root.contains(marker) ? marker : null;
	};

	const showMarkerCard = (marker: SVGGElement) => {
		const id = marker.dataset.id;
		if (id) showCard(id, marker);
	};

	const beginPinch = () => {
		const arr = [...pointers.values()];
		if (arr.length < 2) return;
		const [a, b] = arr;
		const rect = svg.getBoundingClientRect();
		const midVB = clientToViewBox(midpoint(a, b), rect, vbW, vbH);
		pinch = {
			startDist: Math.max(1, distance(a, b)),
			startK: transform.k,
			startMidVB: midVB,
			startTx: transform.tx,
			startTy: transform.ty,
		};
		pan = null;
		isDragging = true;
		hideCard();
	};

	svg.addEventListener(
		"wheel",
		(event) => {
			if (isIntro) return;
			event.preventDefault();
			const rect = svg.getBoundingClientRect();
			const m = clientToViewBox({ x: event.clientX, y: event.clientY }, rect, vbW, vbH);
			const factor = Math.exp(-event.deltaY * 0.0015);
			const nk = clampScale(transform.k * factor);
			const scale = nk / transform.k;
			setTransform({
				k: nk,
				tx: m.x - (m.x - transform.tx) * scale,
				ty: m.y - (m.y - transform.ty) * scale,
			});
		},
		{ passive: false },
	);

	svg.addEventListener("pointerdown", (event) => {
		if (isIntro) return;
		if (event.target instanceof Element && event.target.closest(".travel-marker")) return;
		if (event.button !== 0 && event.pointerType === "mouse") return;

		svg.setPointerCapture(event.pointerId);
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

		if (pointers.size === 1) {
			isDragging = false;
			pan = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				startTx: transform.tx,
				startTy: transform.ty,
			};
			hideCard();
		} else if (pointers.size === 2) {
			beginPinch();
		}
	});

	svg.addEventListener("pointermove", (event) => {
		if (!pointers.has(event.pointerId)) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const rect = svg.getBoundingClientRect();

		if (pinch && pointers.size >= 2) {
			const arr = [...pointers.values()];
			const [a, b] = arr;
			const curDist = Math.max(1, distance(a, b));
			const curMidVB = clientToViewBox(midpoint(a, b), rect, vbW, vbH);
			const factor = curDist / pinch.startDist;
			const nk = clampScale(pinch.startK * factor);
			const scale = nk / pinch.startK;
			setTransform({
				k: nk,
				tx:
					pinch.startMidVB.x -
					(pinch.startMidVB.x - pinch.startTx) * scale +
					(curMidVB.x - pinch.startMidVB.x),
				ty:
					pinch.startMidVB.y -
					(pinch.startMidVB.y - pinch.startTy) * scale +
					(curMidVB.y - pinch.startMidVB.y),
			});
			return;
		}

		if (pan && pointers.size === 1 && pan.pointerId === event.pointerId) {
			const dx = event.clientX - pan.startX;
			const dy = event.clientY - pan.startY;
			if (!isDragging && (Math.abs(dx) > TAP_SLOP_PX || Math.abs(dy) > TAP_SLOP_PX)) {
				isDragging = true;
			}
			const scaleX = vbW / rect.width;
			const scaleY = vbH / rect.height;
			setTransform({
				k: transform.k,
				tx: pan.startTx + dx * scaleX,
				ty: pan.startTy + dy * scaleY,
			});
		}
	});

	const endPointer = (event: PointerEvent) => {
		pointers.delete(event.pointerId);
		if (pointers.size === 0) {
			pan = null;
			pinch = null;
			window.setTimeout(() => {
				isDragging = false;
			}, 0);
			return;
		}
		if (pointers.size === 1) {
			pinch = null;
			pan = null;
		}
	};

	svg.addEventListener("pointerup", endPointer);
	svg.addEventListener("pointercancel", endPointer);

	svg.addEventListener("dblclick", (event) => {
		event.preventDefault();
		setTransform({ ...homeTransform });
		hideCard();
	});

	chart.addEventListener("mouseover", (event) => {
		if (isIntro || isDragging) return;
		const marker = markerFromEvent(event);
		if (marker) showMarkerCard(marker);
	});

	chart.addEventListener("mouseout", (event) => {
		const marker = markerFromEvent(event);
		if (!marker) return;
		const related = event.relatedTarget;
		if (related instanceof Element && marker.contains(related)) return;
		if (activeMarker === marker) hideCard();
	});

	chart.addEventListener("click", (event) => {
		if (isIntro || isDragging) return;
		const marker = markerFromEvent(event);
		if (!marker) return;
		showMarkerCard(marker);
	});

	chart.addEventListener("focusin", (event) => {
		if (isIntro) return;
		const marker = markerFromEvent(event);
		if (marker) showMarkerCard(marker);
	});

	chart.addEventListener("focusout", (event) => {
		const marker = markerFromEvent(event);
		if (!marker) return;
		const related = event.relatedTarget;
		if (related instanceof Element && marker.contains(related)) return;
		if (activeMarker === marker) hideCard();
	});

	chart.addEventListener("keydown", (event) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		const marker = markerFromEvent(event);
		if (!marker) return;
		event.preventDefault();
		showMarkerCard(marker);
	});

	window.addEventListener(
		"scroll",
		() => {
			if (activeMarker) positionCard(activeMarker);
		},
		{ passive: true },
	);

	applyTransform();
	runIntro();
}

document.addEventListener("astro:before-swap", () => {
	const card = document.querySelector("[data-place-card]");
	card?.classList.remove("is-visible");
	card?.setAttribute("aria-hidden", "true");
	document.querySelectorAll<HTMLElement>("[data-travel-map]").forEach((root) => {
		delete root.dataset.wired;
	});
});
