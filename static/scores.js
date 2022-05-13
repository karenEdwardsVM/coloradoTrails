window.onload = async () => {
  const scores = await getScores();
  console.log(scores);
  for (const u in scores) {
    let sDiv = dca('div');
    sDiv.setAttribute("id", "score-div");
    ext(ge('counts'), sDiv);
    let nat = messageBox(`<div>${u}:</div>
                          <div>native: ${scores[u].native}</div>
                          <div>non-native: ${scores[u]['non-native']}</div>`)
    nat.style.margin = '2ch';
    nat.style.padding = '1ch';
    nat.style.border = '1px solid black';
    add(ge('score-div'), nat); 
    //let notNat = messageBox('non-native: ' + scores[u]['non-native']);
    //add(ge('score-div'), notNat); 
  }
};
