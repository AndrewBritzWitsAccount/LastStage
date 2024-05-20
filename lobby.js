const lobbies = {};
function createLobby(lobbyName, hostId) {
const lobbyId = generateUniqueId();
lobbies[lobbyId] = { name: lobbyName, hostId, players: [hostId] };
return lobbyId;
}
function joinLobby(lobbyId, playerId) {
if (lobbies[lobbyId]) {
lobbies[lobbyId].players.push(playerId);
return true;
}
return false;
}
function getLobby(lobbyId) {
return lobbies[lobbyId];
}
module.exports = { createLobby, joinLobby, getLobby };