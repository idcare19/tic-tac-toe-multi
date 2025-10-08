const socket = io();
let myId = "";
let myTurn = false;

function joinGame() {
  const name = document.getElementById("playerName").value;
  if (!name) return alert("Enter your name");

  myId = socket.id;
  socket.emit("setName", name);

  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
}

// Update player list
socket.on("players", (players) => {
  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML = "Players: " + players.map(p => p.name + " (" + p.position + ")").join(", ");
});

// Update turn info
socket.on("turn", (id) => {
  myTurn = id === socket.id;
  document.getElementById("turnInfo").innerText = myTurn ? "Your turn!" : "Wait for your turn";
  document.getElementById("rollBtn").disabled = !myTurn;
});

// Roll dice
function rollDice() {
  socket.emit("rollDice");
}

// Receive moves
socket.on("move", (data) => {
  document.getElementById("diceResult").innerText = `${data.name} rolled ${data.dice} and moved to ${data.position}`;
});
