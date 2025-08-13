#!/usr/bin/env node

import Server from './server';

// Start the server
const server = new Server();

server.start().catch((error) => {
  console.error('💥 Failed to start Transaction Firewall API:', error);
  process.exit(1);
});
