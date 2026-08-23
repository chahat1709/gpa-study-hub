// Shared cursor store for unified DOM + 3D cursor communication
export const cursorStore = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  isHovering: false,
  listeners: new Set<() => void>(),

  update(x: number, y: number) {
    this.vx = x - this.x;
    this.vy = y - this.y;
    this.x = x;
    this.y = y;
    this.listeners.forEach(fn => fn());
  },

  setHovering(value: boolean) {
    this.isHovering = value;
    this.listeners.forEach(fn => fn());
  },

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  },
};
