let onsearchkey = null;

const booleanParams = ['dogs', 'atv', 'hiking', 'horse', 'bike', 'motorcycle', 'access', 'ski'];
const textParams = ['name', 'surface', 'type', 'manager', 'url'];
const numericParams = ['min_elevat', 'max_elevat', 'length_mi_'];
// and, observation count, species type / frequency grades,
let query = {};
const booleanBoxes = {};
const changedBooleans = new Set();
let places = {};

window.onload = async () => {
  let lat = 39, lon = -108.66, rad = 0.15;
  const finder = new Map(L, lat, lon, 'findermap', 5);
  let mark = finder.plotMarker(lat, lon);

  const error = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  };
  //geolocation needs https 
  if (navigator.geolocation) {
    console.log("Geolocation loop");
    navigator.geolocation.getCurrentPosition((p) => {
      lat = p.coords.latitude;
      lon = p.coords.longitude;
      mark.setLatLng([lat, lon]);
    }, error);
  }

  finder.map.on('click', (e) => {
    lat = e.latlng.lat;
    lon = e.latlng.lng;
    mark.setLatLng([lat, lon]);
    // display a circle of rad at lat lon
    console.log('coo', lat, lon);
  });

  const onChange = debounce(async (e) => {
    query = {};
    for (let b of booleanParams) {
      if (changedBooleans.has(b)) {
        query[b] = booleanBoxes[b].checked ? 'yes' : 'no';
      }
    }
    console.log('query is', query);
    const trails = await getTrailsInSearch(query, lat, lon, rad);
    results.innerHTML = '';
    places = {};
    for (const {d, v} of trails) {
      if (v < 0) {
        const t = new Trail(d);
        if (!(t.properties.place_id in places)) {
          const p = await getPlace(t.properties.place_id);
          if (p) {
            places[t.properties.place_id] = p;
            p.view(ge('results'), 20, 28);
          }
        } else {
          console.log('already got', t.properties.place_id);
        }
      }
    }
  }, 200);

  for (let b of booleanParams) {
    booleanBoxes[b] = inputBox(b, false, { oncheck: (e) => {
      changedBooleans.add(b);
      onChange();
    }, });
    label = document.createElement('label'); label.innerText = b;
    const pad = padder('1ch', [
      centered([label, booleanBoxes[b]]),
    ]);
    add(ge('searchParams'), pad);
  }

  const tlen = padder('1ch', [
    rangeoption((n, v) => {
      query['length_mi_'] = v;
    }, 'Target trail length', 0, 30, 1.1, {unit: ' miles'}), // allow plural
  ]);
  tlen.style.width = '30vw';
  add(ge('searchParams'), tlen);

  onsearchkey = onChange;
};
