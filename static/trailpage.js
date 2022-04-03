trail = null;

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  trail = new Trail(await getjson('/gettrail/' + trailID));
  ge('title').innerText = String(trail.properties.name);
  ge('length').innerText = 'is ' + String(trail.properties.length_mi_) + ' miles long.';

  const map = new Map(L, 39.002, -108.666);
  console.log(trail);
  const bounds = getBounds(trail.trail);
  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  map.plotTrails([trail.trail], 'blue', 2);

  const varieties = Array.from(new Set(trail.observations.map(e => e.common_name || e.common_guess).filter(e => e)));
  ge('varieties').innerText += varieties.join('\n\t');

  for (const o of trail.observations) {
    const m = new L.marker([Number(o.latitude), Number(o.longitude)]);
    m.addTo(map.map);
  }
};
