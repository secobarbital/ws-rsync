#!/usr/bin/env node

var io = require('socket.io-client');
var throat = require('throat');
var Promise = require('promise');
var Rsync = require('rsync');

var rsync = new Rsync()
  .archive()
  .compress()
  .source(process.env.RSYNC_SOURCE)
  .destination(process.env.RSYNC_DESTINATION);

var syncIt = throat(1, syncItLoud);

syncIt().then(function() {
  var socket = io(process.env.SERVER);
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
});

function syncItNow() {
  return new Promise(function(resolve, reject) {
    console.log('syncIt');
    rsync.execute(function(err, code, cmd) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function syncItLoud() {
  return syncItNow()
    .then(function() {
      console.log('syncedIt');
    }, function(err) {
      console.log('suckedIt', err);
    });
}
