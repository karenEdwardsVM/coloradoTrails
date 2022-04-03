window.onload = async () => {
  const trailID = Number(queryParam('id'));
  ge('title').innerText = 'Viewing ' + trailID;
  const map = new Map(L, 39.002, -108.666);
  await map.plotAround(39.002, -108.666, 0.1);
  const trail = await getjson('/gettrail/' + trailID);
  console.log(trail);
};
