window.onload = async () => {
  const scores = await getScores(),
        sa = Object.entries(scores).sort((a, b) => (b[1].native + b[1]["non-native"]) - (a[1].native + a[1]["non-native"]));
  for (const u of sa) {
    let sDiv = dca('div');
    sDiv.setAttribute("id", "score-div");
    ext(ge('counts'), sDiv);
    let nat = messageBox(`<div>${u[0]}:</div>
                          <div>native: ${u[1].native}</div>
                          <div>non-native: ${u[1]['non-native']}</div>`)
    nat.style.margin = '2ch';
    nat.style.padding = '1ch';
    nat.style.border = '1px solid black';
    add(ge('score-div'), nat); 
  }
};
