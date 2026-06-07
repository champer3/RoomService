let io = null;
let socketID = {};

function setIO(ioInstance) {
  io = ioInstance;
}

function getIO() {
  return io;
}

function getSocketID() {
  return socketID;
}

function setSocketIDEntry(userId, id) {
  socketID[userId] = id;
}

function removeSocketIDEntry(userId) {
  delete socketID[userId];
}

module.exports = { setIO, getIO, getSocketID, setSocketIDEntry, removeSocketIDEntry };
