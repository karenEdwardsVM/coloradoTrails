trails = null;

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  trails = (await getPlace(trailID)).trails;

  ge('title').innerText = String(trails[0].properties.name);
  ge('length').innerText = 'is ' + String(trails[0].properties.length_mi_) + ' miles long.';

  const map = new Map(L, 39.002, -108.666);
  const bounds = trails.map(t => t.bounds).reduce((a, b) => ({
    left: Math.min(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  }));

  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  map.plotTrails(trails, 'red', 2);

  const oseen = new Set(), observations = [];
  for (const t of trails) {
    for (const o of t.observations) {
      if (!oseen.has(o.id)) {
        oseen.add(o.id);
        observations.push(o);
      }
    }
  }

  const varieties = Array.from(new Set(
    observations.map(e => e.common_name || e.species_guess)
                .filter(e => e)
  ));
  ge('varieties').innerText += varieties.join('\n\t');

  for (const o of observations) {
    map.plotMarker(Number(o.latitude), Number(o.longitude));
    const i = img(o.image_url);
    const c = centered(i);
    i.style.maxWidth = '7vw';
    i.style.maxHeight = '7vh';
    c.className = 'observation-icon';
    add(ge('opics'), c);
  }
};
