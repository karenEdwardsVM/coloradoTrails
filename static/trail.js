class Trail {
  constructor(data) {
    this.trail = data.trail;
    this.observations = data.observations;
  }

  get properties() { return this.trail.properties; }
  get geometry() { return this.trail.geometry && this.trail.geometry.coordinates; }

  get center() {
    if (typeof(this.centerCache) !== 'undefined') { return this.centerCache; }
    let Σlat = 0, Σlong = 0;
    for (const p of this.geometry) {
      Σlat += p[0]; Σlong += p[1];
    }
    this.centerCache = [Σlat / this.geometry.length, Σlong / this.geometry.length];
    return this.centerCache;
  }

  get extent() {
    if (typeof(this.extentCache) !== 'undefined') { return this.extentCache; }
    const center = this.center;
    let extent = 0;
    for (const p of this.geometry) {
      const d = distance(center[0], center[1], p[0], p[1]);
      extent = Math.max(d, extent);
    }
    this.extentCache = extent;
    return extent;
  }

  get bounds() {
    if (typeof(this.boundsCache) !== 'undefined') { return this.boundsCache; }
    this.boundsCache = this.geometry.reduce((o, c) => ({
                         left: isFinite(o.left) ? Math.min(o.left, c[1]) : c[1],
                         top: isFinite(o.top) ? Math.max(o.top, c[0]) : c[0],
                         right: isFinite(o.right) ? Math.max(o.right, c[1]) : c[1],
                         bottom: isFinite(o.bottom) ? Math.min(o.bottom, c[0]) : c[0],
                       }), {});
    return this.boundsCache;
  }

  toJSON() {
    return {trail: this.trail, observations: this.observations};
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, };
}
