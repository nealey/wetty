import rl from 'readline';
import emitStream from 'emit-stream';

export default socket => question =>
  new Promise((resolve, reject) => {
    socket.on('disconnect', () => {
      reject();
    });
    const stream = emitStream(socket);
    const r = rl.createInterface({
      input: stream,
      output: stream,
      terminal: true,
    });
    r.question(`${question}: `, answer => {
      r.close();
      resolve(answer);
    });
  });
