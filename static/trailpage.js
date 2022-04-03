window.onload = async () => {
  const trailID = Number(queryParam('id'));
  const trail = new Trail(await getjson('/gettrail/' + trailID));
  ge('title').innerText = 'Viewing: ' + trail.properties.name;

  const map = new Map(L, 39.002, -108.666);
  console.log(trail);
  const bounds = getBounds(trail.trail);
  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  map.plotTrails([trail], 'blue', 2);
};
