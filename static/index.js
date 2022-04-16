let onsearchkey = null;

const booleanParams = ['dogs', 'atv', 'hiking', 'horse', 'bike', 'motorcycle', 'access', 'ski'];
const textParams = ['name', 'surface', 'type', 'manager', 'url'];
const numericParams = ['min_elevat', 'max_elevat', 'length_mi_'];
let query = {};
const booleanBoxes = {};
const changedBooleans = new Set();
let places = {};

// and, observation count, species type / frequency grades,

  // const map = new Map(L, 39.002, -108.666);
  // map.plotAround(39.071445, -108.549728);

window.onload = async () => {
  let lat = 39, lon = -108.66, rad = 0.15;
  const finder = new Map(L, lat, lon, 'findermap', 5);
  finder.map.on('click', (e) => {
    lat = e.latlng.lat;
    lon = e.latlng.lng;
    // display a circle of rad at lat lon
    console.log('coo', lat, lon);
  });

  const onChange = debounce(async (e) => {
    query = {};
    // console.log(ge('searchbar').value);
    for (let b of booleanParams) {
      query[b] = booleanBoxes[b].checked ? 'yes' : 'no'; // also don't include if it hasn't been checked
    }
    console.log('query is', query);
    const trails = await getTrailsInSearch(query, lat, lon, rad);
    console.log(trails);
    results.innerHTML = '';
    places = {};
    for (const {d, v} of trails) {
      const t = new Trail(d);
      if (!(t.properties.place_id in places)) {
        const p = await getPlace(t.properties.place_id);
        if (p) {
          places[t.properties.place_id] = p;
          p.view(ge('results'), '18vw', '10vh');
        }
      } else {
        console.log('already got', t.properties.place_id);
      }
    }
  }, 200);

  for (let b of booleanParams) {
    // add param to selection
    booleanBoxes[b] = inputBox(b, false, { oncheck: onChange, });
    label = document.createElement('label'); label.innerText = b;
    const pad = padder('1ch', [
      centered([label, booleanBoxes[b]]),
    ]);
    add(ge('searchParams'), pad);
  }

  onsearchkey = onChange;
};
