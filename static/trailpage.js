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
  map.plotTrails([trail], 'blue', 2);

  for (const o of trail.observations) {
    const m = new L.marker(o);
    m.addTo(map.map);
  }
};
