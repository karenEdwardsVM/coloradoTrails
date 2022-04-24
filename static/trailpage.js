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

const issueModal = (then) => {
  const b = padder('1ch');
  b.style.position = 'fixed';
  b.style.left = '0'; b.style.right = '0';
  b.style.top = '0'; b.style.bottom = '0';
  b.style.backgroundColor = 'var(--bg)';
  b.style.zIndex = 99999;

  const mi = dca('div');
  mi.style.position = 'relative';
  mi.style.height = '100%';
  mi.style.width = '100%';

  add(mi, messageBox('What\'s the issue?'));

  let issuetype = null, issuelat = 0, issuelon = 0;

  const makepicker = () => {
    const typepicker = padder('1ch');
    typepicker.id = 'type-picker';
    typepicker.style.display = 'flex';
    typepicker.style.justifyContent = 'space-around';
    const issues = ['trash', 'obstructed trail', 'poorly maintained trail', 'broken signage',
                    'broken infrastructure'];
    for (const i of issues) {
      const b = button(i, () => {
        issuetype = i;
        swap(ge('type-picker'), makepicker());
      });
      if (issuetype == i) { b.style.backgroundColor = 'var(--mg)'; }
      add(typepicker, b);
    }
    return typepicker;
  };

  add(mi, makepicker());

  const buttons = padder('1ch');
  buttons.style.position = 'fixed';
  buttons.style.left = '0'; buttons.style.right = '0'; buttons.style.bottom = '0';
  buttons.style.backgroundColor = 'var(--bg)';
  buttons.style.display = 'flex';
  buttons.style.justifyContent = 'space-around';

  add(buttons, button('There\'s no issue.', () => { del(b); }));
  add(buttons, button('Report it!', () => {
    then(issuetype, issuelat, issuelon);
    del(b);
  }));

  add(mi, messageBox('Where was the issue?'));
  const mapc = dca('div');
  mapc.style.width = '100%';
  mapc.style.height = '50vh';
  mapc.id = 'issue-map';
  add(mi, mapc);

  after(20, () => {
    const issuemap = new Map(L, 39.002, -108.666, 'issue-map');
    issuemap.fitBounds(place.bounds.left, place.bounds.top, place.bounds.right, place.bounds.bottom);
    place.plotTrails(issuemap, 'red', 2);

    let mark = issuemap.plotMarker(issuelat, issuelon);
    const error = (err) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        issuelat = p.coords.latitude;
        issuelon = p.coords.longitude;
        mark.setLatLng([lat, lon]);
      }, error);
    }

    issuemap.map.on('click', (e) => {
      issuelat = e.latlng.lat;
      issuelon = e.latlng.lng;
      mark.setLatLng([issuelat, issuelon]);
    });
  });

  add(mi, buttons);
  add(b, mi);

  return b;
};

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  place = await getPlace(trailID);
  rocks = place.rocks;

  ge('title').innerText = place.name;
  ge('length').innerText = 'is ' + String(place.length_mi) + ' miles long';
  ge('length').innerText += ' with ' + String(toprec(place.maxElevation - place.minElevation, 1)) + ' feet of elevation gain.';
  const onTrash = button('Report Issue', async () => {
    const modal = issueModal(async (issuetype, issuelat, issuelon) => {
      await postjson(`/issue/${place.properties.place_id}/${issuetype}/${issuelat}/${issuelon}`);
    });
    add(document.body, modal);
  });
  onTrash.style.marginLeft = '1ch';
  add(ge('inner-info'), onTrash);

  const map = new Map(L, 39.002, -108.666);
  const bounds = boundingBox(place.bounds,
                             place.observations.map(o => ([Number(o.latitude), Number(o.longitude)])));

  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  place.plotTrails(map, 'red', 2);

  // here put the map info into trail-info div
  const d = ge('trail-info'),
        p = place.properties,
        pLabels = {'surface': 'surface', 'type': 'type',
                   'hiking': 'hiking', 'horse': 'horse', 'bike': 'bike',
                   'motorcycle': 'motorcycle', 'atv': 'atv', 'ohv_gt_50': 'ohv',
                   'highway_ve': 'highway vehicle', 'dogs': 'dogs',
                   'ski': 'ski', 'snowshoe': 'snowshoe'};
  for (k in pLabels) {
    const b = messageBox((p[k] == null) ? `${pLabels[k]}: N/A` :
                                          `${pLabels[k]}: ${p[k]}`,
                         true);
    b.style.padding = '0 1ch';
    add(d, padder('1px', [b]));
  }

  const minElev = place.minElevation, maxElev = place.maxElevation;
  const minb = messageBox(`min elevation: ${minElev}`, true);
  minb.style.padding = '0 1ch';
  add(d, padder('1px', [minb]));
  const maxb = messageBox(`max elevation: ${maxElev}`, true);
  maxb.style.padding = '0 1ch';
  add(d, padder('1px', [maxb]));

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
        animal = createIcon('/bighorn.png', [32, 70]),
        plant = createIcon('/Columbine.png'),
        fungi = createIcon('/Amanita.png'),
        obsCounts = {'Mammalia': 0, 'Animalia': 0, 'Reptilia': 0, 'Plantae': 0, 'Fungi': 0, 'Aves': 0, 'other': 0},
        markerImage = {'Reptilia': animal, 'Mammalia': animal, 'Animalia': animal, 'Aves': animal,
                       'Plantae': plant,
                       'Fungi': fungi,
                      };

  for (const o of observations) {
    let mark = map.plotMarker(Number(o.latitude), Number(o.longitude));
    if (markerImage[o.iconic_taxon_name]) { 
      mark.setIcon(markerImage[o.iconic_taxon_name]);
      obsCounts[o.iconic_taxon_name] += 1;
    } else {
      obsCounts.other += 1;
    }
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

  const rIcon = createIcon('/rock.png', [30, 30], [15, 15]);
  for (const r of rocks){
    let coords = r.geometry.coordinates;
    mark = map.plotMarker(coords[0], coords[1]);
    mark.setIcon(rIcon);
    const popup = dca('div');
    add(popup, messageBox(r.properties.commod1));
    if (r.properties.commod2) {
      add(popup, messageBox(r.properties.commod2));
    }
    if (r.properties.commod3) {
      add(popup, messageBox(r.properties.commod3));
    }
    if (r.properties.ore) {
      add(popup, messageBox(r.properties.ore));
    }
    if (r.properties.oper_type) {
      add(popup, messageBox(r.properties.oper_type));
    }
    mark.bindPopup(popup);
  }

  for (let i = 0; i < 3; i++) { add(ge('opics'), padder('10vw')); }

  let myIcon = createIcon('/pointer.png', [50, 50], [48, 48], 'pointer-image'),
      prev = null;

  const legend = dca('div');
  legend.id = 'legend';
  add(ge('map-container'), legend);
  add(legend, padder('0 1ch 0 0', [`Animalia: ${obsCounts.Animalia + obsCounts.Mammalia + obsCounts.Aves + obsCounts.Reptilia}
                                   <img style="height:1em;" src='bighorn.png'/>`]));
  add(legend, padder('0 1ch 0 0', [`Fungi: ${obsCounts.Fungi} <img style="height:1em;" src='Amanita.png'/>`]));
  add(legend, padder('0 1ch 0 0', [`Plantae: ${obsCounts.Plantae} <img style="height:1em;" src='Columbine.png'/>`]));
  add(legend, messageBox(`Other: ${obsCounts.other}`));

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
