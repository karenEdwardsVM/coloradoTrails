class Trail {
  constructor(data) {
    this.trail = data.trail;
    this.observations = data.observations;
  }

  get properties() { return this.trail.properties; }
  get geometry() { return this.trail.geometry && this.trail.geometry.coordinates; }

  toJSON() {
    return {trail: this.trail, observations: this.observations};
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = { Trail, };
}
