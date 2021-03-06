const boundingBox = (o, cs) => {
  return cs.reduce((o, c) => ({
    left: isFinite(o.left) ? Math.min(o.left, c[1]) : c[1],
    top: isFinite(o.top) ? Math.max(o.top, c[0]) : c[0],
    right: isFinite(o.right) ? Math.max(o.right, c[1]) : c[1],
    bottom: isFinite(o.bottom) ? Math.min(o.bottom, c[0]) : c[0],
  }), o);
};

const mergeBounds = (bs) => {
  return bs.reduce((a, b) => ({
    left: Math.min(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  }));
};

class Trail {
  constructor(data) {
    this.cache = {};
    this.trail = data.trail;
    this.observations = data.observations || [];
    this.rocks = data.rocks || [];
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
    this.cache.bounds = boundingBox({}, this.geometry);
    return this.cache.bounds;
  }

  toJSON() {
    return {trail: this.trail, observations: this.observations, rocks: this.rocks || []};
  }
}

class Place {
  constructor(data) {
    this.trails = data.trails.map(t => t instanceof Trail ? t : new Trail(t));
  }

  get name() { return String(this.trails[0].properties.name); }
  get length_mi() { return toprec(this.trails.reduce((o, t) => o + t.length_mi, 0), 3); }
  get properties() { return this.trails[0].properties; }
  get bounds() { return mergeBounds(this.trails.map(t => t.bounds)); }
  get minElevation() { return Math.min(...this.trails.map(t => t.properties.min_elevat)); }
  get maxElevation() { return Math.max(...this.trails.map(t => t.properties.max_elevat)); }

  plotTrails(map, ...as) { return map.plotTrails(this.trails, ...as); }

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

  description(lat, lon, w) {
    const outer = padder('0ch');
    outer.style.width = w;
    add(outer, messageBox(this.name));
    add(outer, messageBox(this.observations.length + plural(this.observations.length, ' observation')));
    add(outer, messageBox(this.length_mi + ' miles long'));
    const bounds = this.bounds;
    add(outer, messageBox('about ' + toprec(toMi(distance(lat, lon,
                                                          (bounds.bottom + bounds.top) / 2,
                                                          (bounds.left + bounds.right) / 2)), 3) +
                          ' miles away'));
    return outer;
  }

  get rocks() {
    let dep_ids = new Set(), out = [];
    for (const t of this.trails) {
      for (const r of t.rocks) {
        if (!dep_ids.has(r.properties.dep_id)) {
          dep_ids.add(r.properties.dep_id);
          out.push(r);
        }
      }
    }
    return out;
  }

  view(container, w, h, uw = 'vw', uh = 'vh') {
    if (this.map) { return this.mapcontainer; }
    this.mapid = genid();

    this.mapcontainer = document.createElement('div');
    this.mapcontainer.style.width = w + uw;
    this.mapcontainer.style.height = h + uh;
    this.mapcontainer.style.maxWidth = w + uw;
    this.mapcontainer.setAttribute('id', this.mapid);
    add(container, this.mapcontainer);

    const bounds = this.bounds;
    this.map = new Map(L, (bounds.bottom + bounds.top) / 2, (bounds.left + bounds.right) / 2, this.mapid, 7, {
      zoomControl: false,
      scrollWheelZoom: false,
      touchZoom: false,
      attributionControl: false,
      dragging: false,
    });
    this.plotTrails(this.map, 'red', 2);
    this.map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);

    return this.mapcontainer;
  }

  markHead(map) {
    return map.plotMarker(this.trails[0].geometry[0][0], this.trails[0].geometry[0][1]);
  }

  toJSON() {
    return {trails: this.trails, rocks: this.rocks || []};
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, Place, };
}
