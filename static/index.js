// add search button, save trail, species selections
//   click to zoom to trail

let onsearchkey = null;

const booleanParams = ['dogs', 'atv', 'hiking', 'horse', 'bike', 'motorcycle', 'access', 'ski'];
const textParams = ['name', 'surface', 'type', 'manager', 'url'];
const numericParams = ['min_elevat', 'max_elevat', 'length_mi_'];
// and, observation count, species type / frequency grades,
let query = {};
const booleanBoxes = {};
const changedBooleans = new Set();
let places = {};
let length_mi = 1.1;

window.onload = async () => {
  let lat = 39.0708, lon = -105.7, rad = 0.15;
  const finder = new Map(L, lat, lon, 'findermap', 6);
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
    query['length_mi_'] = length_mi;
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
      length_mi = v;
    }, 'Target trail length', 0, 30, length_mi, {unit: ' miles'}), // allow plural
  ]);
  tlen.style.width = '100%';
  add(ge('searchParams'), tlen);

  const trad = padder('1ch', [
    rangeoption((n, v) => {
      rad = v / 69.8;
    }, 'How far are you willing to travel?', 0, 200, rad * 69.8, {unit: ' miles'}), // allow plural
  ]);
  trad.style.width = '100%';
  add(ge('searchParams'), trad);

  const sb = button('Search', onChange);
  sb.style.width = '100%';
  add(ge('searchParams'), sb);
  onsearchkey = onChange;
};
