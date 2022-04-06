place = null;

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  place = await getPlace(trailID);

  ge('title').innerText = place.name;
  ge('length').innerText = 'is ' + String(place.length_mi) + ' miles long.';

  const map = new Map(L, 39.002, -108.666);
  const bounds = place.bounds;

  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  place.plotTrails(map, 'red', 2);

  const observations = place.observations;
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
    c.setAttribute('title', o.common_name || o.species_guess);
    c.className = 'observation-icon';
    add(ge('opics'), c);
  }
};
