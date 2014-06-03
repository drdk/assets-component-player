/*global clearTimeout: true, document: true, window: true, $: true, DR: true, Browser: true, Request: true, define: true, escape: true, Element: true, Fx: true, Class: true, Events: true, Options: true, Swiff: true, gemiusStream: true */

/**
* @name Video Player
* @fileOverview 
*/

/**
* Creates an instance of a video player. 
* The element must have an data-resource attribute refering to the GetResource
* service. IE: http://www.dr.dk/handlers/GetResource.ashx?id=1136684
* <pre><code>
* <div class="dr-widget-video-player" data-resource="/handlers/GetResource.ashx?id=1136684" data-image="hest.jpg"></div>
* </code></pre>
* Optional attributes:
* data-gchannel Custom Gemius channel metadata
*/
define("dr-widget-video-player", ["dr-media-player-factory"], function (PlayerFactory) {
    "use strict";
    return new Class({
        initialize: function (element) {
            PlayerFactory.getPlayer({
                'element': element,
                'videoData': {
                    'videoType': (element.get('data-channel') ? 'live' : 'ondemand'),
                    'resource': element.get('data-resource'),
                    'image': element.get('data-image'),
                    'channelId': element.get('data-channel'),
                    'startTimeCode': element.get('data-time')
                },
                'appData': {
                    'autoPlay': (element.get('data-autoplay') == 'true'),
                    'gemius': {
                        'channelName': (element.get('data-gchannel') ? element.get('data-gchannel') : 'drdk')
                    }
                },
                'enableHashTimeCode': (element.get('data-enableHashTimeCode') == 'true')
            });
        }
    });
});
