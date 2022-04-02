window.onload = async () => {
  const map = L.map('map').setView([39.002, -108.666], 7);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
  }).addTo(map);
  
  const plotTrails = (l, c, w, o) => {
    for (const p of l) {
      const coords = p.geometry.coordinates;
      const thPolyline = L.polyline(coords);
      thPolyline.setStyle({color: c, weight: w, opacity: o});
      thPolyline.addTo(map);
    }
  }
  // plot designated trails and trailheads, which are the same
  //plotTrails(desTrails.features, 'red', 8, 0.5);
  //plotTrails(trailheads.features, 'blue', 5, 0.8);

  const plotAround = async (a) => {
    const nearby = await getTrailsAround(a[0], a[1], 0.3);
    plotTrails(nearby.trails, 'red', 5);
  };
  //plotAround([39.071445, -108.549728]);
  
  //plot observations
  const obs = await getjson(`/observations/`);
  console.log(obs);
  const plotObservations = (o) => {
    for (let i = 1; i < o.length - 1; i++) {
      const lati = Number(o[i].latitude);
      const longi = Number(o[i].longitude);
      if (isFinite(lati) || isFinite(longi)) {
        console.log(lati, longi);
        const m = new L.polyline([[lati, longi]], {color:'green'});
        m.addTo(map);
      }
      //m.setStyle({color: 'green', weight: 0.5});
    }
  };
  plotObservations(obs);
};
