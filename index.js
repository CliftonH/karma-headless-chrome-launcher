var os = require('os');
var path = require('path');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var whichSync = require('which').sync;
var Xvfb = require('xvfb');
var chromeLocation = require('chrome-location');

var HeadlessChromeBrowser = function(baseBrowserDecorator, args) {

  var self = this;
  baseBrowserDecorator(this);

  this.name = 'HeadlessChrome';

  this.start = function (url) {

    if (!chromeLocation) {
      this._done('Cannot find Chrome executable.');
    }

    try {
      whichSync('Xvfb');
    } catch (e) {
      this._done('Cannot find Xvfb executable.');
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

    function quit() {
      xvfb.stop(function(err) {
        console.log(err);
      });
    }

    xvfb.start(function(err, xvfbProcess) {
      if (err) {
        self._done('Failed to start Xvfb: ' + err);
        return;
      }

      var crProcess = spawn(chromeLocation, chromeFlags);

      crProcess.on('exit', function () {
        self.kill(quit);
      });
    });

  };

  this.kill = function (done) {
    function allDone() {
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