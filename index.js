var os = require('os');
var path = require('path');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var whichSync = require('which').sync;
var Xvfb = require('xvfb');
var chromeLocation = require('chrome-location');

var HeadlessChromeBrowser = function(baseBrowserDecorator, args) {

  var self = this;
  var chromeProcess;
  baseBrowserDecorator(this);

  this.name = 'HeadlessChrome';

  this.start = function (url) {

    if (!chromeLocation) {
      console.error('Cannot find Chrome executable.');
      this.kill();
    }

    try {
      whichSync('Xvfb');
    } catch (e) {
      console.error('Cannot find Xvfb executable.');
      this.kill();
    }

    var chromeFlags = [
      '--user-data-dir=' + this._tempDir,
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-timer-throttling'
    ].concat(args.chromeFlags || [], [url]);

    var xvfb = new Xvfb({
      silent: true,
      xvfb_args: [
        '-screen',
        '0',
        '1024x768x24',
        '-ac'
      ]
    });

    xvfb.startSync();

    chromeProcess = spawn(chromeLocation, chromeFlags);

    chromeProcess.on('exit', function() {
      xvfb.stopSync();
    });

  };

  this.kill = function (done) {
    function allDone() {
      chromeProcess.exit();
      if (done) {
        done();
      }
      self._done();
    }
    process.nextTick(allDone);
  };
};

module.exports = {
  'launcher:HeadlessChrome': ['type', HeadlessChromeBrowser]
};