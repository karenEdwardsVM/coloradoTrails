place = null;

// Preemptive caching guide
//   on map load, write it to an image and store it in localstorage
//     or, write a map layer that preemptively caches tiles to localstorage
//

const middleChild = (container) => {
  const mid = (dims(document.body).left + dims(document.body).right) / 2;
  let bestc = null, bestd = 20000;
  for (const c of container.children) {
    const r = (dims(c).right + dims(c).left) / 2;
    const d = Math.abs(mid - r);
    if (d < bestd) {
      bestc = c;
      bestd = d;
    }
  }
  return bestc;
};

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

  for (let i = 0; i < 3; i++) { add(ge('opics'), padder('10vw')); }

  const createIcon = (image, size = [50, 50], anchor = [48, 48], className = undefined) => {
    return L.icon({
      iconUrl: image,
      iconSize: size, 
      iconAnchor: anchor,
      className,
    });
  };

  const oData = {}, 
        animal = createIcon('/bighorn.png', [25, 50]),
        plant = createIcon('/Columbine.png'),
        fungi = createIcon('/Amanita.png'),
        markerImage = {'Mammalia': animal, 'Animalia': animal, 'Plantae': plant, 'Fungi': fungi, 'Aves': animal};

  for (const o of observations) {
    let mark = map.plotMarker(Number(o.latitude), Number(o.longitude));
    if (markerImage[o.iconic_taxon_name]) { mark.setIcon(markerImage[o.iconic_taxon_name]) }
    const i = img(o.image_url); // don't repeat this.
    const c = centered([i]);
    i.style.maxWidth = '20vw';
    i.style.maxHeight = '13vh';
    c.setAttribute('title', o.common_name || o.species_guess);
    c.className = 'observation-icon';
    c.dataset.click = o.image_url;
    oData[c.dataset.click] = { 
      onclick: onClick(ge('varieties'), o), 
      marker: mark,
      o,
      defaultIcon: mark.getIcon(),
    };

    add(ge('opics'), c);
    mark.on('click', oData[c.dataset.click].onclick);
  }

  for (let i = 0; i < 3; i++) { add(ge('opics'), padder('10vw')); }

  let myIcon = createIcon('/pointer.png', [50, 50], [48, 48], 'pointer-image'),
      prev = null;

  ge('opics').onscroll = () => {
    const f = middleChild(ge('opics'));
    if (f.className === 'observation-icon' && f.children[0].complete) {
      if (prev) {
        if (prev.className === 'observation-icon') {
          const po = oData[prev.dataset.click];
          prev.style.background = 'initial';
          po.marker.setIcon(po.defaultIcon);
        }
      }

      const o = oData[f.dataset.click];
      f.style.background = 'var(--mg)';
      o.marker.setIcon(myIcon);
      o.onclick();
      prev = f;
    }
  };
};
