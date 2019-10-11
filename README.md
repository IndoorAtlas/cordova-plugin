_This plugin has recently been updated to a new version 3.x with new a new API.
Refer `migration-guide.md` for instructions on migrating from 2.x versions or
for instructions on staying in the old version until you have time to migrate._

# IndoorAtlas Cordova Plugin <img src="https://img.shields.io/github/release/IndoorAtlas/cordova-plugin.svg">

[IndoorAtlas](https://www.indooratlas.com/) provides a unique Platform-as-a-Service (PaaS) solution that runs a disruptive geomagnetic positioning in its full-stack hybrid technology for accurately pinpointing a location inside a building. The IndoorAtlas SDK enables app developers to use high-accuracy indoor positioning in venues that have been fingerprinted.

## Getting started

 1. Before starting, read the [quick overview of IndoorAtlas technology](https://indooratlas.freshdesk.com/support/solutions/articles/36000079590-indooratlas-positioning-overview) to understand the necessary steps in the deployment process
 2. Set up your [free developer account](https://app.indooratlas.com) in the IndoorAtlas developer portal.
 3. To enable IndoorAtlas indoor positioning in a venue, the venue needs to be fingerprinted with the [IndoorAtlas MapCreator 2](https://play.google.com/store/apps/details?id=com.indooratlas.android.apps.jaywalker) tool.
 4. To start developing your own app using the Cordova plugin, create an [API key](https://app.indooratlas.com/apps) and plug it into our [example application available on Github](https://github.com/IndoorAtlas/sdk-cordova-examples).

## Documentation

The full documentation for the IndoorAtlas Cordova plugin is available at: https://docs.indooratlas.com/cordova/3.0/

## Development notes

The documentation is generated from the latest code with `documentation.js`.
Usage:

    npm install -g documentation
    documentation build www/IndoorAtlas.js -f html -o /tmp/docs/

## License

Copyright 2015-2019 IndoorAtlas Ltd. The Cordova Plugin is released under the Apache License. See the [LICENSE.md](https://github.com/IndoorAtlas/cordova-plugin/blob/master/LICENSE) file for details.
