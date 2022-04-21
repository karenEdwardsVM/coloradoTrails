place = null;

// Preemptive caching guide
//   on map load, write it to an image and store it in localstorage
//     or, write a map layer that preemptively caches tiles to localstorage

window.onload = async () => {
  const trailID = Number(queryParam('id'));
  place = await getPlace(trailID);

  ge('title').innerText = place.name;
  ge('length').innerText = 'is ' + String(place.length_mi) + ' miles long.';

  const map = new Map(L, 39.002, -108.666);
  const bounds = place.bounds;

  map.fitBounds(bounds.left, bounds.top, bounds.right, bounds.bottom);
  place.plotTrails(map, 'red', 2);

  // here put the map info into trail-info div
  const d = ge('trail-info');
        p = place.properties;
        pLabels = {'name': 'name', 'surface': 'surface', 'type': 'type', 
                   'hiking': 'hiking', 'horse': 'horse', 'bike': 'bike', 
                   'motorcycle': 'motorcycle', 'atv': 'atv', 'ohv_gt_50': 'ohv', 
                   'highway_ve': 'highway vehicle', 'dogs': 'dogs', 'min_elevat': 'min elevation', 
                   'max_elevat': 'max elevation', 'length_mi_': 'length (miles)'
                   'ski': 'ski', 'snowshoe': 'snowshoe'};
  for (k in pLabels) {
    add(d, messageBox((p[k] == null) ? `<div>${pLabels[k]}: N/A</div>` : 
                                       `<div>${pLabels[k]}: ${p[k]}</div>`));
  }

  const observations = place.observations;
  const varieties = Array.from(new Set(
    observations.map(e => e.common_name || e.species_guess)
                .filter(e => e)
  ));
  ge('varieties').innerText += varieties.join('\n\t');

  const onClick = (d, o) => { 
    // add to a box with species name, etc.
    return () => {
      d.innerHTML = "";
      add(d, messageBox(`<div>Kingdom: ${o.iconic_taxon_name}</div>
                         <div>Scientific: ${o.scientific_name}</div>
                         <div>Common: ${o.common_name}</div>`));
      const i = img(o.image_url);
      const c = centered([i]);
      i.style.maxHeight = '40vh';
      //i.style.objectFit = 'contain';
      c.setAttribute('title', o.common_name || o.species_guess);
      add(d, c);
    };
  };

  //const hover = (el) => {
  //  el.addEventListener('mouseover',() => {
  //  
  //  });
  //}

  for (const o of observations) {
    let mark = map.plotMarker(Number(o.latitude), Number(o.longitude));
    const i = img(o.image_url);
    const c = centered([i]);
    i.style.maxWidth = '7vw';
    i.style.maxHeight = '7vh';
    c.setAttribute('title', o.common_name || o.species_guess);
    c.className = 'observation-icon';
    hover(i);
    add(ge('opics'), c);
    mark.on('click', onClick(ge('varieties'), o));
  }

};
