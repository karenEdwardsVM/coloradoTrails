// add search button, save trail, species selections
//   click to zoom to trail

let onsearchkey = null, trails = null, searchObservations = null, searchVarieties = null, oldLines = [];

const booleanParams = ['dogs', 'atv', 'hiking', 'horse', 'bike', 'motorcycle', 'ski'];
const textParams = ['name', 'surface', 'type', 'manager', 'url'];
const numericParams = ['min_elevat', 'max_elevat', 'length_mi_'];
// and, observation count, species type / frequency grades,
let query = {};
const booleanBoxes = {};
const speciesBoxes = {};
const changedBooleans = new Set();
const changedSpecies = new Set();
let places = {};
let length_mi = 2;
let species = {
  mammals: 'Mammalia',
  birds: 'Aves',
  plants: 'Plantae',
  spiders: 'Arachnida',
  insects: 'Insecta',
  fungi: 'Fungi',
  reptiles: 'Reptilia',
  amphibians: 'Amphibia',
  molluscs: 'Mollusca',
  animals: 'Animalia',
  protozoa: 'Protozoa',
  cacti: ['Cactuses', 'cacti'],
  lichen: 'lichens',
  orchids: 'Orchids',
  cedars: 'Cedars',
  pinyon: 'Pinyon',
  spruce: 'Spruce',
};
// lots of natives, lots of invasives?

const mapButton = (container, lat, lon, p) => {
  const b = padder('1ch');
  add(container, b);
  const a = dca('a');
  add(b, a);

  const d = p.description(lat, lon);
  add(a, d);
  a.setAttribute('href', `/trail.html?id=${p.properties.place_id}`);
  a.style.textDecoration = 'none';
  a.style.color = 'var(--fg)';
  p.view(a, 20, 20);
  return b;
};

window.onload = async () => {
  try {
  let lat = 39.0708, lon = -105.7, rad = 0.15;
  const finder = new Map(L, lat, lon, 'findermap', 6);
  let mark = finder.plotMarker(lat, lon);

  const error = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  };
  //geolocation needs https 
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((p) => {
      lat = p.coords.latitude; lon = p.coords.longitude;
      mark.setLatLng([lat, lon]);
    }, error);
  }

  finder.map.on('click', (e) => {
    lat = e.latlng.lat; lon = e.latlng.lng;
    mark.setLatLng([lat, lon]);
    // display a circle of rad at lat lon
  });

  const onChange = debounce(async (e) => {
    query = {};
    for (let b of booleanParams) {
      if (changedBooleans.has(b)) {
        query[b] = booleanBoxes[b].checked ? 'yes' : 'no';
      }
    }
    query['length_mi_'] = length_mi;
    query.species = {};
    for (const k of Object.keys(species)) {
      if (changedSpecies.has(k)) {
        if (species[k] instanceof Array) {
          for (const s of species[k]) { query.species[species[s]] = speciesBoxes[k].checked; }
        } else {
          query.species[species[k]] = speciesBoxes[k].checked;
        }
      }
    }
    query.species = encodeURIComponent(btoa(JSON.stringify(query.species)));

    console.log('query is', query);
    const trailName = ge('searchbar').value;
    if (trailName != '') {
      query.trailName = trailName;
    }
    trails = await getTrailsInSearch(query, lat, lon, rad);

    searchObservations = [].concat(...[].concat(...trails.map(t => t.d.trails)).map(t => t.observations));
    searchVarieties = searchObservations.reduce((vs, o) => {
      const n = (o.species_guess || o.scientific_name || o.common_name).toLowerCase();
      if (!(n in vs)) { vs[n] = o; }
      return vs;
    }, {});

    localStorage.setItem('varieties', JSON.stringify(searchVarieties));

    // searchVarieties = Array.from(new Set(searchObservations.map(o => (o.scientific_name || o.common_name).toLowerCase()))).filter(n => n != '');

    results.innerHTML = '';
    if (trails.length == 0) {
      add(results, messageBox('No trails found!'));
    }
    places = {};
    let i = 0;
    for (const {d, v} of trails) {
      if (v < 0 || trails.length < 10 || i++ < 10) {
        const p = new Place(d);
        if (!(p.properties.place_id in places)) {
          if (p) {
            places[p.properties.place_id] = p;
            mapButton(ge('results'), lat, lon, p);
          }
        }
      }
    }

    for (const l of oldLines) { if (l) { l.remove(); } }
    oldLines = [];
    if (Object.values(places).length > 0) {
      const searchBounds = mergeBounds(Object.values(places).map(p => p.bounds));
      for (const k in places) {
        oldLines = oldLines.concat(places[k].plotTrails(finder, 'red', 2));
      }
      finder.fitBounds(searchBounds.left, searchBounds.top, searchBounds.right, searchBounds.bottom);
    }
  }, 200);

  for (let b of booleanParams) {
    booleanBoxes[b] = inputBox(b, false, { oncheck: (e) => {
      changedBooleans.add(b);
    }, });
    label = document.createElement('label'); label.innerText = b;
    label.style.userSelect = 'none';
    label.style.cursor = 'pointer';
    label.onclick = () => { booleanBoxes[b].click(); };
    const pad = padder('1ch', [
      centered([label, booleanBoxes[b]]),
    ]);
    add(ge('searchParams'), pad);
  }

  const tlen = padder('1ch 1ch 1ch 0ch', [
    rangeoption((n, v) => {
      length_mi = v;
    }, 'How far do you want to go?', 0, 30, length_mi, {unit: ' miles'}), // allow plural
  ]);
  tlen.style.width = '100%';
  add(ge('searchParams'), tlen);

  const trad = padder('1ch 1ch 1ch 0ch', [
    rangeoption((n, v) => {
      rad = v / 69.8;
    }, 'How far are you willing to travel?', 0, 200, toprec(rad * 69.8, 0), {unit: ' miles'}), // allow plural
  ]);
  trad.style.width = '100%';
  add(ge('searchParams'), trad);

  const speciesParams = padder('1ch');
  speciesParams.style.display = 'flex';
  speciesParams.style.flexWrap = 'wrap';
  speciesParams.style.paddingLeft = '0ch';

  const smb = messageBox('Are you looking for anything specific?')
  smb.style.width = '100%';
  add(speciesParams, smb);
  for (const k of Object.keys(species)) {
    speciesBoxes[k] = inputBox(k, false, { oncheck: (e) => {
      changedSpecies.add(k);
    }, });
    const label = messageBox(k);
    label.style.userSelect = 'none';
    label.style.cursor = 'pointer';
    label.onclick = () => { speciesBoxes[k].click(); };
    add(speciesParams, padder('0 0 0 1ch', [centered([label, speciesBoxes[k]])]));
  }
  add(ge('searchParams'), speciesParams);

  const sb = button('Search', onChange);
  sb.style.width = '100%';
  add(ge('searchParams'), sb);
  onsearchkey = onChange;
  } catch (e) {
    alert(e.toString());
  }
};
