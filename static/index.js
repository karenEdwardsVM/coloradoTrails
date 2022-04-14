let onsearchkey = null;

const booleanParams = ['dogs', 'atv', 'hiking', 'horse', 'bike', 'motorcycle', 'access', 'ski'];
const textParams = ['name', 'surface', 'type', 'manager', 'url'];
const numericParams = ['min_elevat', 'max_elevat', 'length_mi_'];
let query = {};
const booleanBoxes = {};

// and, observation count, species type / frequency grades,

  // const map = new Map(L, 39.002, -108.666);
  // map.plotAround(39.071445, -108.549728);

window.onload = async () => {
  const onChange = debounce((e) => {
    query = {};
    console.log(ge('searchbar').value);
    for (let b of booleanParams) {
      query[b] = booleanBoxes[b].checked ? 'yes' : 'no';
    }
    console.log('query is', query);
  }, 200);

  for (let b of booleanParams) {
    // add param to selection
    const pad = padder('1ch');
    booleanBoxes[b] = inputBox(b, false, { oncheck: onChange, });
    label = document.createElement('label'); label.innerText = b;
    add(pad, label);
    add(pad, booleanBoxes[b]);
    add(ge('searchParams'), pad);

  }

  onsearchkey = onChange;
};
