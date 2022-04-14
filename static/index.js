let onsearchkey = null;
//const sendSearch = debounce((s) => {
//}, 200);

window.onload = async () => {
  onsearchkey = debounce((e) => {
    console.log(ge('searchbar').value);
  }, 200);
  // const map = new Map(L, 39.002, -108.666);
  // map.plotAround(39.071445, -108.549728);
};
