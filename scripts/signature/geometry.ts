import type { Point } from "./true-type";

type Position = { x: number; y: number };
export type Command =
  | { type: "M" | "L"; x: number; y: number }
  | { type: "Q"; x: number; y: number; x1: number; y1: number };

const midpoint = (a: Position, b: Position): Position => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
const distance = (a: Position, b: Position): number => Math.hypot(a.x - b.x, a.y - b.y);

export function contourCommands(
  points: Point[],
  x: number,
  baseline: number,
  scale: number,
): Command[] {
  if (points.length === 0) return [];
  const first = points[0];
  const last = points[points.length - 1];
  const start = last.onCurve
    ? last
    : first.onCurve
      ? first
      : { ...midpoint(first, last), onCurve: true };
  const commands: Command[] = [
    { type: "M", x: x + start.x * scale, y: baseline - start.y * scale },
  ];
  let control: Point | undefined;
  const from = last.onCurve ? 0 : first.onCurve ? 1 : 0;
  const end = last.onCurve ? points.length - 1 : points.length;
  for (let i = from; i <= end; i++) {
    const point = i === end ? start : points[i];
    if (point.onCurve) {
      const px = x + point.x * scale;
      const py = baseline - point.y * scale;
      if (control) {
        commands.push({
          type: "Q",
          x1: x + control.x * scale,
          y1: baseline - control.y * scale,
          x: px,
          y: py,
        });
        control = undefined;
      } else {
        const previous = commands[commands.length - 1];
        if (px !== previous.x || py !== previous.y) commands.push({ type: "L", x: px, y: py });
      }
    } else {
      if (control) {
        commands.push({
          type: "Q",
          x1: x + control.x * scale,
          y1: baseline - control.y * scale,
          x: x + ((control.x + point.x) / 2) * scale,
          y: baseline - ((control.y + point.y) / 2) * scale,
        });
      }
      control = point;
    }
  }
  // SVG fills close contours automatically. Preserve the signature's existing
  // serialization, which omits a redundant final straight segment to the start.
  if (commands.at(-1)?.type === "L") commands.pop();
  return commands;
}

const number = (value: number): string => {
  const fixed = value.toFixed(2);
  return Number.isInteger(Number(fixed)) ? String(Number(fixed)) : fixed;
};

export function pathData(commands: Command[]): string {
  return commands
    .map((command) =>
      command.type === "Q"
        ? `Q${number(command.x1)} ${number(command.y1)} ${number(command.x)} ${number(command.y)}`
        : `${command.type}${number(command.x)} ${number(command.y)}`,
    )
    .join("")
    .replaceAll(" -", "-");
}

// Integrate |B'(t)| by projecting its linear derivative onto the acceleration
// direction. Collinear curves need a separate branch, including reversing cusps.
function quadraticLength(a: Position, b: Position, c: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ex = c.x - b.x - dx;
  const ey = c.y - b.y - dy;
  const acceleration = Math.hypot(ex, ey);
  if (acceleration < 1e-7 * Math.max(1, Math.hypot(dx, dy))) {
    return 2 * Math.hypot(dx + ex / 2, dy + ey / 2);
  }
  const start = (dx * ex + dy * ey) / acceleration;
  const end = start + acceleration;
  const height = Math.abs(dx * ey - dy * ex) / acceleration;
  const integral = (value: number) =>
    height < 1e-12
      ? value * Math.abs(value)
      : value * Math.hypot(value, height) + height * height * Math.asinh(value / height);
  return (integral(end) - integral(start)) / acceleration;
}

const rounded = (value: number): number => Number(number(value));

export function pathLength(commands: Command[]): number {
  let previous: Position = { x: 0, y: 0 };
  let length = 0;
  for (const command of commands) {
    const end = { x: rounded(command.x), y: rounded(command.y) };
    if (command.type === "L") length += distance(previous, end);
    if (command.type === "Q") {
      length += quadraticLength(previous, { x: rounded(command.x1), y: rounded(command.y1) }, end);
    }
    previous = end;
  }
  return length;
}

const extreme = (a: number, b: number, c: number, values: number[]) => {
  const t = (a - b) / (a - 2 * b + c);
  if (t > 0 && t < 1) values.push((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c);
};

export function pathBounds(commands: Command[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  let previous: Position = { x: 0, y: 0 };
  for (const command of commands) {
    xs.push(command.x);
    ys.push(command.y);
    if (command.type === "Q") {
      extreme(previous.x, command.x1, command.x, xs);
      extreme(previous.y, command.y1, command.y, ys);
    }
    previous = command;
  }
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}
