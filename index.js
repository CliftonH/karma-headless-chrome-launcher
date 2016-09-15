var q = require('q');
var spawn = require('child_process').spawn;
var whichSync = require('which').sync;
var Xvfb = require('xvfb');
var chromeLocation = require('chrome-location');

var HeadlessChromeBrowser = function(baseBrowserDecorator, args) {

  var self = this;
  baseBrowserDecorator(this);

  this.name = 'HeadlessChrome';

  var xvfb = new Xvfb({
    silent: true,
    xvfb_args: [
      '-screen',
      '0',
      '1024x768x24',
      '-ac'
    ]
  });

  var chromeProcess;

  this.start = function (url) {

    if (!chromeLocation) {
      console.error('Cannot find Chrome executable.');
      self.kill();
    }

    try {
      whichSync('Xvfb');
    } catch (e) {
      console.error('Cannot find Xvfb executable.');
      self.kill();
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

    xvfb.start(function(err) {
      if (err) {
        console.error('Failed to start Xvfb: ' + err);
        self.kill();
        return;
      }
      chromeProcess = spawn(chromeLocation, chromeFlags);
    });

  };

  this.kill = function (done) {
    function allDone() {
      self._done();
      if (done) {
        done();
      }
    }
    var deferred = q.defer();
    xvfb.stop(function() {
      chromeProcess.kill('SIGINT');
      deferred.promise.then(allDone);
    });
  };

  this.forceKill = function () {
    var self = this;

    return q.promise(function (resolve) {
      self.kill(resolve);
    });
  }
};

module.exports = {
  'launcher:HeadlessChrome': ['type', HeadlessChromeBrowser]
};