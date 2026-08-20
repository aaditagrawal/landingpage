type Transform = { k: number; tx: number; ty: number };

/** The world-view and India-inset zoom/pan pair serialised onto the prebuilt SVG. */
type MapTransforms = { global: Transform; home: Transform };

const TAP_SLOP_PX = 6;
const INTRO_MS = 1100;

type Point = { x: number; y: number };

type PlaceMeta = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note?: string;
  home?: boolean;
};

type MapCleanup = () => void;

const cleanups = new WeakMap<HTMLElement, MapCleanup>();

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function parseTransforms(svg: SVGSVGElement): MapTransforms {
  const fallback: MapTransforms = { global: { k: 1, tx: 0, ty: 0 }, home: { k: 1, tx: 0, ty: 0 } };
  const raw = svg.dataset.mapTransforms;
  if (!raw) return fallback;
  try {
    // SAFETY: data-map-transforms is written by buildWorldMapSvg() in the same build (via
    // scripts/build-travel-map.ts) from computeIndiaTransform()'s MapTransform values, so this is
    // our own JSON round-trip rather than third-party input. A malformed attribute throws and
    // falls back to the identity pair below.
    return JSON.parse(raw) as MapTransforms;
  } catch {
    return fallback;
  }
}

function placeFromMarker(marker: SVGGElement): PlaceMeta | null {
  const { id, name, lat, lng, note, home } = marker.dataset;
  if (!id || !name || !lat || !lng) return null;
  return {
    id,
    name,
    lat: Number(lat),
    lng: Number(lng),
    note: note || undefined,
    home: home === "true",
  };
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

/** Pixel-equivalent wheel delta (line/page modes vary by browser). */
function wheelDeltaPixels(event: WheelEvent): number {
  let dy = event.deltaY;
  if (event.deltaMode === 1) dy *= 16;
  else if (event.deltaMode === 2) dy *= window.innerHeight;
  return dy;
}

export function initTravelMaps(): void {
  document.querySelectorAll<HTMLElement>("[data-travel-map]").forEach((root) => {
    if (root.dataset.wired === "true") return;
    const svg = root.querySelector<SVGSVGElement>(".travel-map__chart svg");
    if (!svg) return;
    root.dataset.wired = "true";
    cleanups.set(root, wireTravelMap(root));
  });
}

function wireTravelMap(root: HTMLElement): MapCleanup {
  const svg = root.querySelector<SVGSVGElement>(".travel-map__chart svg");
  const layer = svg?.querySelector<SVGGElement>(".travel-zoom-layer");
  const chart = root.querySelector<HTMLElement>(".travel-map__chart");
  const card = document.querySelector<HTMLElement>("[data-place-card]");
  const eyebrow = document.querySelector<HTMLElement>("[data-place-eyebrow]");
  const nameEl = document.querySelector<HTMLElement>("[data-place-name]");
  const coordsEl = document.querySelector<HTMLElement>("[data-place-coords]");
  const noteEl = document.querySelector<HTMLElement>("[data-place-note]");

  if (!svg || !layer || !chart || !card || !eyebrow || !nameEl || !coordsEl || !noteEl) {
    return () => {};
  }

  if (card.parentElement !== document.body) document.body.appendChild(card);

  const vbW = Number(svg.dataset.vbW ?? 960);
  const vbH = Number(svg.dataset.vbH ?? 520);
  const { global: globalTransform, home: homeTransform } = parseTransforms(svg);
  const minScale = homeTransform.k;
  const maxScale = homeTransform.k * 24;

  let transform: Transform = { ...globalTransform };
  let activeMarker: SVGGElement | null = null;
  let isDragging = false;
  let isIntro = true;

  const markerCircles = [
    ...root.querySelectorAll<SVGCircleElement>(".travel-marker circle[data-base-r]"),
  ];

  const pointers = new Map<number, Point>();
  let pinch: {
    startDist: number;
    startK: number;
    startMidVB: Point;
    startTx: number;
    startTy: number;
  } | null = null;
  let pan: {
    pointerId: number;
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
  } | null = null;
  let wheelFrame = 0;
  let wheelDelta = 0;
  let wheelPoint: Point | null = null;
  let scrollRaf = 0;

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
    layer.setAttribute(
      "transform",
      `translate(${transform.tx} ${transform.ty}) scale(${transform.k})`,
    );
    const markerScale = Math.min(1, homeTransform.k / transform.k);
    for (const circle of markerCircles) {
      const baseR = Number(circle.dataset.baseR);
      if (Number.isFinite(baseR)) circle.setAttribute("r", String(baseR * markerScale));
    }
    if (activeMarker) positionCard(activeMarker);
  };

  const setTransform = (next: Transform, skipClamp = false) => {
    transform = skipClamp ? next : clampTransform(next);
    applyTransform();
  };

  const skipIntro = sessionStorage.getItem("travel-map-seen") === "1";

  const runIntro = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || skipIntro) {
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
          sessionStorage.setItem("travel-map-seen", "1");
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

  const showCard = (marker: SVGGElement) => {
    if (isDragging) return;
    const place = placeFromMarker(marker);
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
    showCard(marker);
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

  const zoomAt = (client: Point, deltaPixels: number) => {
    const rect = svg.getBoundingClientRect();
    const m = clientToViewBox(client, rect, vbW, vbH);
    const factor = Math.exp(-deltaPixels * 0.0025);
    const nk = clampScale(transform.k * factor);
    const scale = nk / transform.k;
    setTransform({
      k: nk,
      tx: m.x - (m.x - transform.tx) * scale,
      ty: m.y - (m.y - transform.ty) * scale,
    });
  };

  const flushWheel = () => {
    wheelFrame = 0;
    if (!wheelPoint || wheelDelta === 0) return;
    const delta = wheelDelta;
    const point = wheelPoint;
    wheelDelta = 0;
    wheelPoint = null;
    zoomAt(point, delta);
  };

  const onWheel = (event: WheelEvent) => {
    if (isIntro) return;
    event.preventDefault();
    wheelDelta += wheelDeltaPixels(event);
    wheelPoint = { x: event.clientX, y: event.clientY };
    if (!wheelFrame) wheelFrame = requestAnimationFrame(flushWheel);
  };

  const onPointerDown = (event: PointerEvent) => {
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
  };

  const onPointerMove = (event: PointerEvent) => {
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
  };

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

  const onDblClick = (event: MouseEvent) => {
    event.preventDefault();
    setTransform({ ...homeTransform });
    hideCard();
  };

  const onMouseOver = (event: Event) => {
    if (isIntro || isDragging) return;
    const marker = markerFromEvent(event);
    if (marker) showMarkerCard(marker);
  };

  const onMouseOut = (event: MouseEvent) => {
    const marker = markerFromEvent(event);
    if (!marker) return;
    const related = event.relatedTarget;
    if (related instanceof Element && marker.contains(related)) return;
    if (activeMarker === marker) hideCard();
  };

  const onClick = (event: Event) => {
    if (isIntro || isDragging) return;
    const marker = markerFromEvent(event);
    if (!marker) return;
    showMarkerCard(marker);
  };

  const onFocusIn = (event: Event) => {
    if (isIntro) return;
    const marker = markerFromEvent(event);
    if (marker) showMarkerCard(marker);
  };

  const onFocusOut = (event: FocusEvent) => {
    const marker = markerFromEvent(event);
    if (!marker) return;
    const related = event.relatedTarget;
    if (related instanceof Element && marker.contains(related)) return;
    if (activeMarker === marker) hideCard();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const marker = markerFromEvent(event);
    if (!marker) return;
    event.preventDefault();
    showMarkerCard(marker);
  };

  const onScroll = () => {
    if (!activeMarker) return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      if (activeMarker) positionCard(activeMarker);
    });
  };

  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", endPointer);
  svg.addEventListener("pointercancel", endPointer);
  svg.addEventListener("dblclick", onDblClick);
  chart.addEventListener("mouseover", onMouseOver);
  chart.addEventListener("mouseout", onMouseOut);
  chart.addEventListener("click", onClick);
  chart.addEventListener("focusin", onFocusIn);
  chart.addEventListener("focusout", onFocusOut);
  chart.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScroll, { passive: true });

  applyTransform();
  runIntro();

  return () => {
    svg.removeEventListener("wheel", onWheel);
    svg.removeEventListener("pointerdown", onPointerDown);
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerup", endPointer);
    svg.removeEventListener("pointercancel", endPointer);
    svg.removeEventListener("dblclick", onDblClick);
    chart.removeEventListener("mouseover", onMouseOver);
    chart.removeEventListener("mouseout", onMouseOut);
    chart.removeEventListener("click", onClick);
    chart.removeEventListener("focusin", onFocusIn);
    chart.removeEventListener("focusout", onFocusOut);
    chart.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScroll);
    hideCard();
  };
}

document.addEventListener("astro:before-swap", () => {
  const card = document.querySelector("[data-place-card]");
  card?.classList.remove("is-visible");
  card?.setAttribute("aria-hidden", "true");

  document.querySelectorAll<HTMLElement>("[data-travel-map]").forEach((root) => {
    cleanups.get(root)?.();
    cleanups.delete(root);
    delete root.dataset.wired;
  });
});
