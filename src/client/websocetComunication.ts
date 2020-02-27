import { connect } from 'socket.io-client';

export const webSocket = connect(document.location.href);
