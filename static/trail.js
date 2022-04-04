class Trail {
  cache = {};
  constructor(data) {
    this.trail = data.trail;
    this.observations = data.observations;
  }

  get properties() { return this.trail.properties; }
  get geometry() { return this.trail.geometry && this.trail.geometry.coordinates; }

  get center() {
    if (typeof(this.cache.center) !== 'undefined') { return this.cache.center; }
    let Σlat = 0, Σlong = 0;
    for (const p of this.geometry) {
      Σlat += p[0]; Σlong += p[1];
    }
    this.cache.center = [Σlat / this.geometry.length, Σlong / this.geometry.length];
    return this.cache.center;
  }

  get extent() {
    if (typeof(this.cache.extent) !== 'undefined') { return this.cache.extent; }
    const center = this.center;
    let extent = 0;
    for (const p of this.geometry) {
      const d = distance(center[0], center[1], p[0], p[1]);
      extent = Math.max(d, extent);
    }
    this.cache.extent = extent;
    return extent;
  }

  get bounds() {
    if (typeof(this.cache.bounds) !== 'undefined') { return this.cache.bounds; }
    this.cache.bounds = this.geometry.reduce((o, c) => ({
                         left: isFinite(o.left) ? Math.min(o.left, c[1]) : c[1],
                         top: isFinite(o.top) ? Math.max(o.top, c[0]) : c[0],
                         right: isFinite(o.right) ? Math.max(o.right, c[1]) : c[1],
                         bottom: isFinite(o.bottom) ? Math.min(o.bottom, c[0]) : c[0],
                       }), {});
    return this.cache.bounds;
  }

  toJSON() {
    return {trail: this.trail, observations: this.observations};
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, };
}
