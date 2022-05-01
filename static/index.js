// add search button, save trail, species selections
//   click to zoom to trail

let onsearchkey = null;

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
let speciesList = [
  'beetles', 'cacti', 'spiders', 'lichens', 'grasses', 'insects', 'lizards', 'weeds',
  'flowers', 'bees', 'mice',
  'Mammalia', 'Aves', 'Plantae', 'Arachnida', 'Insecta', 'Fungi', 'Reptilia',
  'Amphibia', 'Mollusca', 'Animalia', 'Chromista', 'Protozoa', 'Orchids',
  'Cedars', 'Cactuses', 'Crickets',
  'Pinyon', 'Spruce', 'Sedges',
].map(s => s.toLowerCase());

const mapButton = (container, lat, lon, p) => {
  const b = padder('1ch');
  add(container, b);

  const d = p.description(lat, lon);
  add(b, d);
  p.view(b, 20, 20);

  b.onclick = () => {
    location.href = `/trail.html?id=${p.properties.place_id}`;
  };

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
    for (const s of speciesList) {
      if (changedSpecies.has(s)) {
        query.species[s] = speciesBoxes[s].checked;
      }
    }
    query.species = encodeURIComponent(btoa(JSON.stringify(query.species)));

    console.log('query is', query);
    const trailName = ge('searchbar').value;
    if (trailName != '') {
      query.trailName = trailName;
    }
    const trails = await getTrailsInSearch(query, lat, lon, rad);
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

  const tlen = padder('1ch', [
    rangeoption((n, v) => {
      length_mi = v;
    }, 'How far do you want to go?', 0, 30, length_mi, {unit: ' miles'}), // allow plural
  ]);
  tlen.style.width = '100%';
  add(ge('searchParams'), tlen);

  const trad = padder('1ch', [
    rangeoption((n, v) => {
      rad = v / 69.8;
    }, 'How far are you willing to travel?', 0, 200, toprec(rad * 69.8, 0), {unit: ' miles'}), // allow plural
  ]);
  trad.style.width = '100%';
  add(ge('searchParams'), trad);

  const speciesParams = padder('1ch');
  speciesParams.style.display = 'flex';
  speciesParams.style.flexWrap = 'wrap';

  const smb = messageBox('Are you looking for anything specific?')
  smb.style.width = '100%';
  add(speciesParams, smb);
  for (const s of speciesList) {
    speciesBoxes[s] = inputBox(s, false, { oncheck: (e) => {
      changedSpecies.add(s);
    }, });
    const label = messageBox(s);
    label.style.userSelect = 'none';
    label.style.cursor = 'pointer';
    label.onclick = () => { speciesBoxes[s].click(); };
    add(speciesParams, padder('0 0 0 1ch', [centered([label, speciesBoxes[s]])]));
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
