const activeSockets: SocketIO.Socket[] = [];

export function socketConnection(socket: SocketIO.Socket) {
  activeSockets.push(socket);

  socket.on('mousemove', mousemove => {
    const sendTo = activeSockets.filter(e => e !== socket);
    sendTo.forEach(s => {
      s.emit('mousemove', mousemove);
    });
  });

  socket.on('disconnect', () => {
    const indexOf = activeSockets.indexOf(socket);
    if (indexOf !== -1) activeSockets.splice(indexOf, 1);
  });
}
