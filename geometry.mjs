// Unit-square coordinates keep preview, gestures and 1024px export consistent.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function constrain(transform) {
  return { x: transform.x, y: transform.y, scale: clamp(transform.scale, .5, 4) };
}
export function imageRect(transform, aspect, size) {
  const t = constrain(transform);
  const width = Math.max(1, aspect) * t.scale * size;
  const height = Math.max(1, 1 / aspect) * t.scale * size;
  return { x: (.5 + t.x) * size - width / 2, y: (.5 + t.y) * size - height / 2, width, height };
}
export function zoomAt(start, scale, anchor, target) {
  const nextScale = clamp(scale, .5, 4);
  const ratio = nextScale / start.scale;
  return constrain({ scale: nextScale,
    x: target.x - .5 - (anchor.x - .5 - start.x) * ratio,
    y: target.y - .5 - (anchor.y - .5 - start.y) * ratio });
}
