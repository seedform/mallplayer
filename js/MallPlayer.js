function assert(cond, msg) {
    if (!cond) {
        throw msg || 'Assertion failure!';
    }
}

var app = {};

app.locations = {
  mall: {
    volume: 0.9,
    effects: [
      new Pizzicato.Effects.HighPassFilter({
        frequency: 600,
        peak: 0.0001
      }),
      new Pizzicato.Effects.LowPassFilter({
        frequency: 3400,
        peak: 0.0001
      }),
      new Pizzicato.Effects.Reverb({
        time: 0.8,//2.5,
        decay: 0.5,
        reverse: false,
        mix: 0.9
      })
    ]
  },
  lounge: {
    volume: 0.07,
    effects: [
      new Pizzicato.Effects.HighPassFilter({
        frequency: 500,
        peak: 0.0001
      }),
      new Pizzicato.Effects.LowPassFilter({
        frequency: 3500,
        peak: 0.0001
      }),
      new Pizzicato.Effects.Convolver({
        impulse: '/aud/impulse1.wav', // http://www.openairlib.net/auralizationdb/content/underground-car-park
        mix: 1
      })
    ]
  }
};

app.init = function(files) {
  assert(files.length > 0);
  app.ready = false;
  app.playing = true; // initially set to true to start playing automatically
  app.trackNum = -1;
  app.files = files;
  app.location = app.locations.mall;
  app._startTrack(0);
}

app._startTrack = function(trackNum) {
  if (app.playing && !!app.track) {
    clearInterval(app.pollId);
    app.track.stop();
  }
  app.ready = false;
  app.trackNum = trackNum;
  app.track = new Pizzicato.Sound(
    {
      source: 'file',
      options: {
        path: URL.createObjectURL(app.files[app.trackNum]),
        loop: false,
        volume: 0.5,
        release: 0
      }
    },
    function() {
      app.ready = true;
      app.setLocation(app.location);
      var audioTitle = app.files[app.trackNum].name.replace(/\.[^/.]+$/, "");
      $('#filename').text(audioTitle);
      document.title = '\u25B6 ' + audioTitle;
      if (app.playing) app.play();
    }
  );
}

app.playNext = function() {
  if (app.ready) app._startTrack((app.trackNum + 1) % app.files.length);
}

app.playPrev = function() {
  var prevTrackNum = (app.trackNum + app.files.length - 1) % app.files.length;
  if (app.ready) app._startTrack(prevTrackNum);
}

app.setLocation = function(location) {
  if (!app.ready) return;
  app.location.effects.forEach(function(effect) {
    if (app.track.effects.indexOf(effect) >= 0) {
      app.track.removeEffect(effect);
    }
  });
  location.effects.forEach(function(effect) {
    app.track.addEffect(effect);
  });
  app.location = location;
  app.track.volume = location.volume;
}

app.play = function() {
  if (!app.ready) return;
  app.track.play();
  app.playing = true;
  app.pollId = setInterval(
    function() {
      if (app.playing && !app.track.playing && !app.track.paused) {
        clearInterval(app.pollId);
        app.playNext();
      }
    },
    200
  );
  $('#throbber').css('display', 'block');
  $('#btn-play').css('background-image', 'url(/img/pause.png)');
}

app.pause = function() {
  if (!app.ready) return;
  app.playing = false;
  app.track.pause();
  clearInterval(app.pollId);
  $('#throbber').css('display', 'none');
  $('#btn-play').css('background-image', 'url(/img/play.png)');
}

app.stop = function() {
  if (!app.ready) return;
  app.playing = false;
  app.track.stop();
  clearInterval(app.pollId);
  $('#throbber').css('display', 'none');
  $('#btn-play').css('background-image', 'url(/img/play.png)');
}

$(function() {

  // rain loop
  app.rainLoop = new Pizzicato.Sound({
    source: 'file',
    options: {
      path: '/aud/rain-loop.ogg',
      loop: true,
      volume: 0.1
    }
  }, function() {
    app.rainLoop.play();
  });

  // load user audio
  $('#file-audio').on('change', function() {
    if (!this.files.length) return;
    if (!!app.track && app.track.playing) app.track.stop();
    app.init(this.files);
  });

  // upload button proxy
  $('#btn-load').on('click', function() {
    $('#file-audio').click();
  });

  // play/pause
  $('#btn-play').on('click', function() {
    if (!app.track) return;
    else if (app.playing) {
      app.pause();
    } else {
      app.play();
    }
  });

  // stop
  $('#btn-stop').on('click', app.stop);

  // prev
  $('#btn-prev').on('click', app.playPrev);

  // next
  $('#btn-next').on('click', app.playNext);

  $('#btn-rain').on('click', function() {
    if (!app.rainLoop) return;
    if (app.rainLoop.playing) {
      app.rainLoop.pause();
      $('#btn-rain').css("opacity", "0.3");
    } else {
      app.rainLoop.play();
      $('#btn-rain').css("opacity", "1.0");
    }
  });
});