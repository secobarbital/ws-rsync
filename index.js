#!/usr/bin/env node

var _ = require('lodash');
var io = require('socket.io-client');
var Rsync = require('rsync');

var syncIt = _.throttle(syncItNow, 1000);

var rsync = new Rsync()
  .archive()
  .compress()
  .source(process.env.RSYNC_SOURCE)
  .destination(process.env.RSYNC_DESTINATION);

syncIt(function() {
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

function syncItNow(done) {
  console.log('syncIt');
  rsync.execute(function(err, code, cmd) {
    console.log('syncedIt', err, code, cmd);
    if (_.isFunction(done)) {
      done();
    }
  });
}
