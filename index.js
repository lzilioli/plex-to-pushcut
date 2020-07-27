'use strict';

// https://support.plex.tv/hc/en-us/articles/115002267687-Webhooks

var _ = require('lodash');
var express = require('express');
var axios = require('axios');
var multer = require('multer');
var debug = require('debug')('plex-to-pushcut');

var app = express();
var upload = multer({ dest: '/tmp/' });

if(!process.env.PUSHCUT_SECRET) {
  throw new Error(`missing env variable PUSHCUT_SECRET`);
}
const pushcutSecret = process.env.PUSHCUT_SECRET;

var PLEX_WEBHOOK_PORT = parseInt(process.env.PLEX_WEBHOOK_PORT, 10) || 12000;
if(isNaN(PLEX_WEBHOOK_PORT)){
  throw new Error(`PLEX_WEBHOOK_PORT should be a number`)
}

let settings;
try {
  settings = require('./settings.js');
} catch(e) {
  console.log(`loading the app with example setttings.
To custtomize for your home, create settings.js in the root of this repo.

cp settings-example.js settings.js`);
  settings = require('./settings-example.js')
}

function main() {
  // TODO #1 can I somehow get the thumbnail and pass it to pushcut as a base64 encoded image?
  app.post('/', upload.single('thumb'), function (req, res, next) {
    console.log('file?', req.file);
    var payload = JSON.parse(req.body.payload);
    // debug('webhook hit with payload', payload);

    const playerName = payload.Player.title;
    console.log('player', playerName);
    const mediaType = payload.Metadata.type;
    console.log('media type', mediaType);
    const mediaEventType = payload.event;
    console.log('event', mediaEventType);

    if (settings.skipPayloadIfNotOwner && !payload.owner) {
      debug('ignoring request because skipPayloadIfNotOwner && owner === false');
      return;
    }

    // Send webhook request to the shortcut for processing
    if (settings.shotcutName) {
      console.log(`invoking shortcut: ${shortcutName}`)
      axios.post(`https://api.pushcut.io/${pushcutSecret}/execute?shortcut=${settings.shortcutName}`, {
          input: payload
        })
        .then((response) => {
          debug('the shortcut said:', response)
        });
    }

    const matchingnotificationActionSets = _.chain(settings.notificationActionSets)
    // Look for action sets matching the payload player
    .filter((actionSet) => {
      return _.indexOf(actionSet.players, playerName) !== -1;
    })
    // Look for action sets matching the payload event
    .filter((actionSet) => {
      return _.indexOf(actionSet.eventTypes, mediaEventType) !== -1;
    })
    // Look for action sets matching the payload Metadata.type
    .filter((actionSet) => {
      return _.indexOf(actionSet.mediaTypes, mediaType) !== -1;
    })
    .value();

    if (matchingnotificationActionSets.length === 0) {
      debug(`no action sets found for ${playerName}, ${mediaType}, ${mediaEventType} combo, skipping`);
      return;
    }

    if (matchingnotificationActionSets.length > 1) {
      console.log(`${matchingnotificationActionSets.length} action sets found for ${playerName}, ${mediaType}, ${mediaEventType} combo. Using the first one. You probably want to modify your config.`);
    }

    const theActionSet = matchingnotificationActionSets[0];

    let title = `${payload.Player.title}`;
    if (payload.event == 'media.play' || payload.event == 'media.resume') {
      title = `🟢 ${title}`;
    } else if (payload.event == 'media.pause') {
      title = `🟡 ${title}`;
    } else if (payload.event == 'media.stop') {
      title = `🛑 ${title}`;
    }

    let text = `📺 You're watching Plex`;
    if (payload.Metadata.type === 'episode') {
      text = `📺 ${payload.Metadata.grandparentTitle} - ${payload.Metadata.title}`;
    } else if (payload.Metadata.type === 'movie') {
      text = `🎥 ${payload.Metadata.title}`;
    } else if (payload.Metadata.type === 'track') {
      text = `🎧 ${payload.Metadata.title}`;
    }

    const form = {
      title,
      text,
      ...theActionSet.notificationPayload
    };
    debug('hitting pushcut with data', JSON.stringify(form, null, 2));

    // TODO #2 add throttling/rate-limiting based on {playerName,mediaType,mediaEventType}
    axios.post(`https://api.pushcut.io/${pushcutSecret}/notifications/${theActionSet.notificationName}`, form)
    .then((response)=>{
      let body = response.body;
      if (body && body.error) {
        console.log(`ERROR from webhook:\n  ${body.error}`);
      }
    });

    res.sendStatus(200);
  });

  console.log(`point plex webhooks to http://localhost:${PLEX_WEBHOOK_PORT} at https://app.plex.tv/desktop#!/settings/webhooks`);
  let server = app.listen(PLEX_WEBHOOK_PORT);

  function closeServer() {
    server.close(() => {
      console.log('Http server closed.');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => {
    closeServer();
  });
  process.on('SIGINT', () => {
    closeServer();
  });
  process.on('SIGUSR2', () => {
    closeServer();
  });
}

main();
