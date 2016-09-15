var q = require('q');
var fs = require('fs');
var spawn = require('child_process').spawn;
var whichSync = require('which').sync;
var Xvfb = require('xvfb');
var chromeLocation = require('chrome-location');

var HeadlessChromeBrowser = function (baseBrowserDecorator, config, emitter, args) {

  var self = this;

  this.name = 'HeadlessChrome';

  baseBrowserDecorator(self);

  var xvfb = new Xvfb({
    silent: true,
    reuse: true,
    xvfb_args: [
      '-screen',
      '0',
      '1024x768x24',
      '-ac'
    ]
  });

  fs.openSync(xvfb._lockFile(), 'a');
  var display = xvfb.display();

  var chromeProcess;

  this.start = function (url) {

    if (!chromeLocation) {
      console.error('Cannot find Chrome executable.');
      self.forceKill();
    }

    try {
      whichSync('Xvfb');
    } catch (e) {
      console.error('Cannot find Xvfb executable.');
      self.forceKill();
    }

    var display = xvfb.display();

    var chromeFlags = [
      '--user-data-dir=' + this._tempDir,
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--display=' + display
    ].concat(args.chromeFlags || [], [url]);

    xvfb.start(function (err) {
      if (err) {
        console.error('Failed to start Xvfb: ' + err);
        self.forceKill();
        return;
      }
      chromeProcess = spawn(chromeLocation, chromeFlags);
    });

  };

  this.on('kill', function (done) {
    function allDone() {
      self._done();
      if (done) {
        done();
      }
    }

    var deferred = q.defer();
    xvfb.stop(function () {
      chromeProcess && chromeProcess.kill('SIGINT');
      deferred.promise.then(allDone);
    });
  });

  this.forceKill = function () {
    return q.promise(function (resolve) {
      self.emit('kill', resolve);
    });
  }
};

module.exports = {
  'launcher:HeadlessChrome': ['type', HeadlessChromeBrowser]
};