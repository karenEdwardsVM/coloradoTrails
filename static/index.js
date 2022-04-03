window.onload = async () => {
  const map = new Map(L, 39.002, -108.666);

  // plot trails around grand junction
  //map.plotAround(39.071445, -108.549728);
  
  const obs = await getjson(`/observations/`);
  const plotObservations = (o) => {
    for (let i = 1; i < o.length - 1; i++) {
      const lat = Number(o[i].latitude);
      const lon = Number(o[i].longitude);
      if (isFinite(lat) || isFinite(lon)) {
        map.plotMarker(lat, lon);
      }
    }
  };
  // plots all observations
  //plotObservations(obs);
};
