window.onload = async () => {
  const trailID = Number(queryParam('id'));
  ge('title').innerText = 'Viewing ' + trailID;
  const map = new Map(L, 39.002, -108.666);
  const trail = await getjson('/gettrail/' + trailID);
  console.log(trail);
  const bounds = getBounds(trail.trail);
  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  map.plotTrails([trail.trail], 'blue', 2);
};
