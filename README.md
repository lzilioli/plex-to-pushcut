# plex-to-pushcut

Node app for mapping plex webhook payloads to [Pushcut](https://www.pushcut.io/index.html).

Supports both Pushcut notifications API as well as the ability to pass the payload on to a shortcut running on your Pushcut automation server.

# One Time Setup

- Install [node.js](https://nodejs.org/en/). I strongly recommend you use [nvm](https://github.com/nvm-sh/nvm).

```bash
git clone git@github.com:lzilioli/plex-to-pushcut.git
nvm use
cd plex-to-pushcut
npm install
# Make a copy of the example settings file as a
# starting point
cp settings-example.js example.js
```

## Configuring Plex

Add the webhook `http://localhost:12000/` to [your plex server](https://app.plex.tv/desktop#!/settings/webhooks).

**Note:** you can override port `12000` using the `PLEX_WEBHOOK_PORT` environment variable.

**Note:** You might be running this node server on a different machine than your Plex Media Server. If this is the case for you, you'll need to use the hostname of the machine that is running this node app in place of `localhost`.

# Settings

It might help to refer to [Plex' webhook documentation](https://support.plex.tv/articles/115002267687-webhooks/) as you read through this section.

This app bridges to two different Pushcut endpoints.

1. `https://api.pushcut.io/<secret>/execute?shortcut=shortcut-name`
2. `https://api.pushcut.io/<secret>/notifications/notification-name`

Depending on your settings, any given incoming Plex webhook could get sent to either, neither, or both of those endpoints.

The settings format is documented below. Refer to settings-example.js in this repo for a real-world example.

```
interface Settings {
  // Specifies the name of the Shortcut on the automation
  // server that should recieve the plex payload. If this
  // is not specified, the Pushcut `/execute` endpoint will // always be skipped.
  shortcutName: string;
  // If true, any incoming payload for which owner is false
  // will never be forwarded to Pushcut.
  skipPayloadIfNotOwner: boolean;
  // Array of NotificationActionSets. This list is where
  // you can specify the relationship between
  // {plex events, media types, and players}
  // and how they map to Pushcut notificatiion
  notificationActionSets: NotificationActionSet[];
}

interface NotificationActionSet {
  // Name of the notification in Pushcut. As long as the
  // notification exists, it doesn't matter how you have it
  // configured within the Pushcut app. The request sent
  // by plex-to-pushcut will override any configurations
  // set in the Pushcut app
  notificationName: string;
  // Media playback events that should trigger this
  // notification. See https://support.plex.tv/articles/115002267687-webhooks/
  eventTypes: string[];
  // Media types that should trigger this
  // notification (movie, episode, track, maybe others?).
  // See https://support.plex.tv/articles/115002267687-webhooks/
  mediaTypes: string[];
  // Names of players that should trigger this notification
  // If you need to determine player names, you can do so
  // by running this app and observing its console output
  // when you play or pause the player with this app running
  players: string[];
  notificationPayload: PushcutNotificationPayload;
}

interface PushcutNotificationPayload {
  // You can specify anything in this object that you
  // would pass to the Pushcut API as documented
  // here: https://www.pushcut.io/support.html#web_api
}
```


# Running the App Locally

```bash
DEBUG=plex-to-pushcut*\
PLEX_WEBHOOK_PORT=12000\
PUSHCUT_SECRET=<your pushcut secret>\
node index.js
```

# As A LaunchAgent

If you are using macOS, you can run this app as a LaunchAgent. I provide a `plex-to-pushcut.plist` as
a starting point. Copy it to `~/Library/LaunchAgents`
and make the following tweaks before loading it:

1. replace `YOUR_PUSHCUT_SECRET` with your secret for your Pushcut account
2. Replace `/Users/admin/.nvm/versions/node/v12.8.3/bin/node` with the proper path to your version of node. You can find this path by typing `which node` into the terminal.
3. Replace `/Users/admin/Projects/plex-to-pushcut` with the path to this repository

To load it into macOS so that it runs forever and starts
back up after you restart the computer:

```bash
cd ~/Library/LaunchAgents/
launchctl load plex-to-pushcut.plist
```

You can load it by following the same steps but by using the `unload` command instead.

## Thanks

Thanks to [plexinc/webhooks-home-automation](https://github.com/plexinc/webhooks-home-automation).
