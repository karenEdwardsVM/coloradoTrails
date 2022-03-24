const getjson = async (u) => {
  return (await (await window.fetch(u)).json());
};

const getTrailsAround = async (lat, lon, rad) => {
  return (await getjson(`/getaround/${lat}/${lon}/${rad}`));
};
