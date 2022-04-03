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

  toJSON() {
    return {trail: this.trail, observations: this.observations};
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, };
}
