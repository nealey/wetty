import { spawn } from 'node-pty';
import { isUndefined } from 'lodash';
import events from './emitter.mjs';
import buffer from './buffer.mjs';

export default class Term {
  static spawn(socket, args) {
    const term = spawn('/usr/bin/env', args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env,
    });
    const address = args[0] === 'ssh' ? args[1] : 'localhost';
    events.spawned(term.pid, address);
    socket.emit('login');
    term.on('exit', code => {
      events.exited(code, term.pid);
      socket
        .emit('logout')
        .removeAllListeners('disconnect')
        .removeAllListeners('resize')
        .removeAllListeners('input');
    });
    term.on('data', data => {
      socket.emit('data', data);
    });
    socket
      .on('resize', ({ cols, rows }) => {
        term.resize(cols, rows);
      })
      .on('input', input => {
        if (!isUndefined(term)) term.write(input);
      })
      .on('disconnect', () => {
        term.end();
        term.destroy();
        events.exited();
      });
  }

  static login(socket) {
    return buffer(socket)('Enter your username');
  }
}
