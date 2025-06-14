function runScript(scriptName) {
  fetch(`/run/${scriptName}`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      document.getElementById("response").textContent = data.output;
    })
    .catch((error) => {
      document.getElementById("response").textContent = `❌ Error:\n${error}`;
    });
}
