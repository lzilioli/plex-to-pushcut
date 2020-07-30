'use strict';
module.exports = {
  // optional, is shortcutName is specified, the full payload
  // will be passed to your automation server
  shortcutName: 'Plex Webhook Receiver',
  shortcutEventFilter: ['playback.started', 'library.new'],
  skipPayloadIfNotOwner: true,
  notificationActionSets: [
    // living room AND (play OR resume) AND (TV Show OR movie)
    {
      eventTypes: ['media.play', 'media.resume'],
      mediaTypes: ['episode', 'movie'],
      players: ['TV - Living Room'],
      notificationName: 'MyPushcutNotification',
      throttleKey: 'living-room-play-start',
      throttleTimeout: 1000 * 60 * 15, /* 15 minutes */
      notificationPayload: {
        // anything as documented in https://www.pushcut.io/support.html#web_api
        defaultAction: {
          name: 'Dim the Lights',
          homekit: 'Dim the Lights',
        },
        actions: [{
          name: 'Dim the Lights',
          homekit: 'Dim the Lights',
        }, {
          name: 'Movie Time',
          homekit: 'Movie Time',
        }]
      }
    },

    // MORE EXAMPLES

    // living room AND (pause OR stop) AND (TV Show OR movie)
    {
      eventTypes: ['media.pause', 'media.stop'],
      mediaTypes: ['episode', 'movie'],
      players: ['TV - Living Room'],
      notificationName: 'MyPushcutNotification',
      throttleKey: 'living-room-play-paused',
      throttleTimeout: 1000 * 60 * 15, /* 15 minutes */
      notificationPayload: {
        defaultAction: {
          name: 'Bighten the Lights',
          homekit: 'Bighten the Lights',
        },
        actions: [{
          name: 'Living',
          homekit: 'Living',
        }]
      }
    },
    // bedroomAND (play OR resume) AND (TV Show OR movie)
    {
      eventTypes: ['media.play', 'media.resume'],
      mediaTypes: ['episode', 'movie'],
      players: ['TV - Bedroom'],
      notificationName: 'MyPushcutNotification',
      throttleKey: 'bedroom-play-start',
      throttleTimeout: 1000 * 60 * 15, /* 15 minutes */
      notificationPayload: {
        defaultAction: {
          homekit: 'In Bed',
        },
        actions: [
          {
            name: 'In Bed',
            homekit: 'In Bed',
          }
        ]
      }
    }
  ]
};
