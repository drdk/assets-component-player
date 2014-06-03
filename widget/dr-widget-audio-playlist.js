/*jshint mootools:true,browser:true,devel:true */
/**
* @name Audio Playlist
* @fileOverview 
*/

/**
* Creates an instance of a audio player and playlist. 
* The element must contain a .audio tag and at least one a.playlist-item tag 
* with a  data-resource attribute refering to the GetResource
* service. IE: http://www.dr.dk/handlers/GetResource.ashx?id=1136684
* <pre><code>
* <div class="dr-widget-audio-playlist">
*    <div class="audio"></div>
*    <ul>
*        <li><a href="#" data-resource="http://www.dr.dk/handlers/GetResource.ashx?id=1136684">item 1</a></li>
*    </ul>
* </div>
* </code></pre>
* Optional attributes:
* data-gchannel Custom Gemius channel metadata
*/
define("dr-widget-audio-playlist", ["dr-media-player-factory"], function (PlayerFactory) {
    "use strict";
    return new Class({
        element: null,
        playlistItemElements: null,
        audioContainerElement: null,
        audioPlayer: null,
        selectedPlaylistItemElement: null,
        channelHasChanged: false,
        contentHasChanged: false,
        initialize: function (element) {
            this.element = element;
            this.audioContainerElement = element.getElement('.audio');
            this.playlistItemElements = element.getElements('.playlist-item');
            this.build();
        },
        build: function () {
            var defaultSelection = this.element.getElement('.playlist-item.selected');
            if (!defaultSelection) {
                defaultSelection = this.playlistItemElements[0];
            }
            this.element.addEvent('click:relay(a.playlist-item)', this.itemClickHandler.bind(this));

            if (!defaultSelection)
                return;
            
            this.audioPlayer = PlayerFactory.getPlayer({
                'element': this.audioContainerElement,
                'videoData': {
                    'videoType': (defaultSelection.get('data-channel') ? 'live' : 'ondemand'),
                    'resource': defaultSelection.get('data-resource'),
                    'channelId': defaultSelection.get('data-channel')
                },
                'appData': {
                    'autoPlay': (this.element.get('data-autoplay') == 'true'),
                    'gemius': {
                        'channelName': (this.element.get('data-gchannel') ? this.element.get('data-gchannel') : 'drdk')
                    }
                },
                'type': 'audio'
            });
            this.selectItem(defaultSelection);
        },
        itemClickHandler: function (event, selectedElement) {
            event.preventDefault();
            this.deselectAll();
            this.selectItem(selectedElement);
            this.audioPlayer.updateOptions({
                'videoData': {
                    'resource': selectedElement.get('data-resource'),
                    'image': selectedElement.get('data-image'),
                    'channelId': selectedElement.get('data-channel')
                }
            });
        },
        selectItem: function (element) {
            element.addClass('selected');
            this.selectedPlaylistItemElement = element;
        },
        deselectAll: function () {
            if (this.selectedPlaylistItemElement) {
                this.selectedPlaylistItemElement.removeClass('selected');
            }
        }
    });
});
