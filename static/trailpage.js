place = null;

// Preemptive caching guide
//   on map load, write it to an image and store it in localstorage
//     or, write a map layer that preemptively caches tiles to localstorage
//
const nthVisible = (container, n) => {
  let i = 0;
  for (const c of container.children) {
    const r = dims(c).right;
    if (r > 0 && (i++ == n)) { return c; }
  }
  return null;
};

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  place = await getPlace(trailID);

  ge('title').innerText = place.name;
  ge('length').innerText = 'is ' + String(place.length_mi) + ' miles long.';

  const map = new Map(L, 39.002, -108.666);
  const bounds = boundingBox(place.bounds,
                             place.observations.map(o => ([Number(o.latitude), Number(o.longitude)])));

  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  place.plotTrails(map, 'red', 2);

  // here put the map info into trail-info div
  const d = ge('trail-info'),
        p = place.properties,
        pLabels = {'name': 'name', 'surface': 'surface', 'type': 'type',
                   'hiking': 'hiking', 'horse': 'horse', 'bike': 'bike',
                   'motorcycle': 'motorcycle', 'atv': 'atv', 'ohv_gt_50': 'ohv',
                   'highway_ve': 'highway vehicle', 'dogs': 'dogs', 'min_elevat': 'min elevation',
                   'max_elevat': 'max elevation', 'ski': 'ski', 'snowshoe': 'snowshoe'};
  for (k in pLabels) {
    const b = messageBox((p[k] == null) ? `${pLabels[k]}: N/A` :
                                          `${pLabels[k]}: ${p[k]}`);
    b.style.padding = '0 1ch';
    add(d, b);
  }

  const observations = place.observations;
  const varieties = Array.from(new Set(
    observations.map(e => e.common_name || e.species_guess)
                .filter(e => e)
  ));
  // ge('varieties').innerText += varieties.join('\n\t');

  const onClick = (d, o) => {
    // add to a box with species name, etc.
    return () => {
      d.innerHTML = "";
      const box = messageBox(`<div>Kingdom: ${o.iconic_taxon_name}</div>
                              <div>Scientific: ${o.scientific_name}</div>
                              <div>Common: ${o.common_name == null ? o.species_guess : o.common_name}</div>`);
      box.style.flex = '1 0 auto';
      add(d, box);
      const i = img(o.image_url);
      const b = dca('div');
      b.style.height = '100%';
      b.style.width = '100%';
      add(d, b);
      const c = centered([i]);
      c.style.height = '100%';
      c.style.maxHeight = dims(b).height + 'px';
      c.style.maxWidth = dims(b).width + 'px';
      i.style.maxHeight = dims(b).height + 'px';
      i.style.maxWidth = dims(b).width + 'px';
      c.setAttribute('title', o.common_name || o.species_guess);
      add(b, c);
    };
  };

  add(ge('opics'), padder('10vw'));
  add(ge('opics'), padder('10vw'));
  add(ge('opics'), padder('10vw'));

  let defaultIcon = null;
  const onclicks = {},
        markers = {};

  for (const o of observations) {
    let mark = map.plotMarker(Number(o.latitude), Number(o.longitude));
    const i = img(o.image_url); // don't repeat this.
    const c = centered([i]);
    i.style.maxWidth = '20vw';
    i.style.maxHeight = '13vh';
    c.setAttribute('title', o.common_name || o.species_guess);
    c.className = 'observation-icon';
    c.dataset.click = o.image_url;
    onclicks[c.dataset.click] = onClick(ge('varieties'), o);
    markers[c.dataset.click] = mark;

    add(ge('opics'), c);
    mark.on('click', onclicks[c.dataset.click]);
    defaultIcon = mark.getIcon();
  }

  add(ge('opics'), padder('10vw'));
  add(ge('opics'), padder('10vw'));
  add(ge('opics'), padder('10vw'));

  let myIcon = L.icon({
    iconUrl: '/pointer.png',
    iconSize: [50, 50], 
    iconAnchor: [48 , 48],
    className: 'pointer-image',
  });

  // figure out middle index from here.
  ge('opics').onscroll = () => {
    const f = nthVisible(ge('opics'), 3);
    if (f.className === 'observation-icon' && f.children[0].complete) {
      f.style.background = 'var(--mg)';
      markers[f.dataset.click].setIcon(myIcon);
      const bf = nthVisible(ge('opics'), 2);
      if (bf && bf.className === 'observation-icon') { 
        bf.style.background = 'initial';
        markers[bf.dataset.click].setIcon(defaultIcon);
      }
      const af = nthVisible(ge('opics'), 4);
      if (af && af.className === 'observation-icon') { 
        af.style.background = 'initial'; 
        markers[af.dataset.click].setIcon(defaultIcon);
      }
      onclicks[f.dataset.click]();
    }
  };
};
