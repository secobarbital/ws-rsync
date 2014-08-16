#!/usr/bin/env node

var socket = require('socket.io-client')(process.env.SERVER);
var Rsync = require('rsync');

var inflight = false;
var deferred = false;
var rsync = new Rsync()
  .archive()
  .compress()
  .source(process.env.RSYNC_SOURCE)
  .destination(process.env.RSYNC_DESTINATION);

syncIt();
socket.on('connect', function() {
  console.log('connect');
  socket.on('disconnect', function() {
    console.log('disconnect');
  });

  socket.on('all', syncIt);
  socket.on('add', function(path) {console.log('File', path, 'has been added');})
  socket.on('addDir', function(path) {console.log('Directory', path, 'has been added');})
  socket.on('change', function(path) {console.log('File', path, 'has been changed');})
  socket.on('unlink', function(path) {console.log('File', path, 'has been removed');})
  socket.on('unlinkDir', function(path) {console.log('Directory', path, 'has been removed');})
  socket.on('error', function(error) {console.error('Error happened', error);})
});

function syncIt() {
  console.log('syncIt');
  if (inflight) {
    console.log('deferring');
    deferred = true;
    return;
  }
  inflight = true;
  console.log('rsyncing');
  rsync.execute(function(err, code, cmd) {
    console.log('rsynced');
    inflight = false;
    if (err) {
      console.error('Error executing rsync', err);
    }
    if (deferred) {
      deferred = false;
      syncIt();
    }
  });
}
