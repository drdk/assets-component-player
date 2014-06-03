/*jshint mootools:true*/

/**
* @name Audio Player
* @fileOverview 
*/

/**
* Creates an instance of a audio player. 
* The element must have an data-resource attribute refering to the GetResource
* service. IE: http://www.dr.dk/handlers/GetResource.ashx?id=1136684
* <pre><code>
* <div class="dr-widget-audio-player" data-resource="/handlers/GetResource.ashx?id=1136684"></div>
* </code></pre>
* Optional attributes:
* data-gchannel Custom Gemius channel metadata
*/
define("dr-widget-audio-player", ["dr-media-player-factory"], function (PlayerFactory) {
    "use strict";
    return new Class({
        initialize: function (element) {
            var player = PlayerFactory.getPlayer({
                'element': element,
                'videoData': {
                    'videoType': (element.get('data-channel') ? 'live' : 'ondemand'),
                    'resource': element.get('data-resource'),
                    'channelId': element.get('data-channel'),
                    'trackviewurl': element.get('data-trackviewurl'),
                    'episodeurn': element.get('data-episodeurn'),
                    'formattedstarttime': element.get('data-announcedstarttime'),
                    'formattedendtime': element.get('data-announcedendtime')
                },
                'appData': {
                    'autoPlay': (element.get('data-autoplay') == 'true'),
                    'gemius': {
                        'channelName': (element.get('data-gchannel') ? element.get('data-gchannel') : 'drdk')
                    }
                },
                'enableHashTimeCode': (element.get('data-enableHashTimeCode') == 'true'),
                'type': 'audio'
            });
        }
    });
});
