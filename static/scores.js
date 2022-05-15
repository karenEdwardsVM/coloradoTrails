window.onload = async () => {
  const scores = await getScores(),
        sa = Object.entries(scores).sort((a, b) => (b[1].native + b[1].nonnative) - (a[1].native + a[1].nonnative));
  for (const u of sa) {
    let sDiv = dca('div');
        nat = messageBox(`<div>${u[0]}</div>
                          <div>native: ${u[1].native}</div>
                          <div>non-native: ${u[1].nonnative}</div>`),
        userd = dca('div');
    userd.className = "user-scores";
    sDiv.className = "scores";
    nat.style.margin = '1ch';
    nat.style.display = 'flex';
    nat.style.flexDirection = 'column';
    nat.style.width = 'max-content'
    add(userd, nat); 
    add(sDiv, userd);
    for (const i of u[1].images) {
      console.log(i);
      const pic = img(i);
      pic.style.margin = '1ch';
      pic.className = 'id-grid-image';
      add(sDiv, pic);
    }
    add(ge('counts'), sDiv);
  }
};
