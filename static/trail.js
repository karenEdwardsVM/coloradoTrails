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

  get length_mi() { return this.properties.length_mi_; }

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

class Place {
  constructor(data) {
    this.trails = data.trails;
  }

  get name() { return String(this.trails[0].properties.name); }
  get length_mi() { return toprec(this.trails.reduce((o, t) => o + t.length_mi, 0), 3); }
  get properties() { return this.trails[0].properties; }

  get bounds() {
    return this.trails.map(t => t.bounds).reduce((a, b) => ({
      left: Math.min(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom),
    }));
  }

  plotTrails(map, ...as) { map.plotTrails(this.trails, ...as); }

  get observations() {
    const oseen = new Set(), observations = [];
    for (const t of this.trails) {
      for (const o of t.observations) {
        if (!oseen.has(o.id)) {
          oseen.add(o.id);
          observations.push(o);
        }
      }
    }
    return observations;
  }

  view(container, w, h, uw = 'vw', uh = 'vh') {
    if (this.map) { return this.map; }
    this.mapid = genid();
    const outer = padder('1ch');
    outer.style.maxWidth = w + uw;
    outer.style.maxHeight = h + uh;
    add(outer, messageBox(this.name));
    add(outer, messageBox(this.observations.length + plural(this.observations.length, ' observation')));
    add(outer, messageBox(this.length_mi + ' miles long'));

    this.mapcontainer = document.createElement('div');
    this.mapcontainer.style.width = (w - 2) + uw;
    this.mapcontainer.style.height = (h - 8) + uh;
    this.mapcontainer.setAttribute('id', this.mapid);
    add(outer, this.mapcontainer)
    add(container, outer);

    const bounds = this.bounds;
    this.map = new Map(L, (bounds.bottom + bounds.top) / 2, (bounds.left + bounds.right) / 2, this.mapid, 7, {
      zoomControl: false,
      scrollWheelZoom: false,
      touchZoom: false,
      attributionControl: false,
    });
    this.plotTrails(this.map, 'red', 2);
    this.map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, Place, };
}
