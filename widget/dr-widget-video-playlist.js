/*jshint mootools:true,browser:true,devel:true */
/**
* @name Video Playlist
* @fileOverview 
*/

/**
* Creates an instance of a video player and playlist. 
* The element must contain a .video tag and at least one a.playlist-item tag 
* with a  data-resource attribute refering to the GetResource
* service. IE: http://www.dr.dk/handlers/GetResource.ashx?id=1136684
* <pre><code>
* <div class="dr-widget-video-playlist">
*    <div class="video"></div>
*    <ol>
*        <li><a href="#" data-resource="http://www.dr.dk/handlers/GetResource.ashx?id=1136684">item 1</a></li>
*    </ol>
* </div>
* </code></pre>
* Optional attributes:
* data-gchannel Custom Gemius channel metadata
*/
define("dr-widget-video-playlist", ["dr-media-player-factory"], function (PlayerFactory) {
    "use strict";
    return new Class({
        element: null,
        playlistItemElements: null,
        videoContainerElement: null,
        videoPlayer: null,
        selectedPlaylistItemElement: null,
        channelHasChanged: false,
        contentHasChanged: false,
        initialize: function (element) {
            this.element = element;
            this.videoContainerElement = element.getElement('.video');
            this.playlistItemElements = element.getElements('.playlist-item');
			this.description = element.getElement('figcaption');
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
            
            this.videoPlayer = PlayerFactory.getPlayer({
                'element': this.videoContainerElement,
                'videoData': {
                    'videoType': (defaultSelection.get('data-channel') ? 'live' : 'ondemand'),
                    'resource': defaultSelection.get('data-resource'),
                    'image': defaultSelection.get('data-image'),
                    'channelId': defaultSelection.get('data-channel')
                },
                'appData': {
                    'autoPlay': (this.element.get('data-autoplay') == 'true'),
                    'gemius': {
                        'channelName': (this.element.get('data-gchannel') ? this.element.get('data-gchannel') : 'drdk')
                    }
                }
            });
            this.selectItem(defaultSelection);
        },
        itemClickHandler: function (event, selectedElement) {
            event.preventDefault();
            this.deselectAll();
            this.selectItem(selectedElement);
            this.videoPlayer.updateOptions({
                'videoData': {
                    'resource': selectedElement.get('data-resource'),
                    'image': selectedElement.get('data-image'),
                    'channelId': selectedElement.get('data-channel')
                }
            });
        },
        selectItem: function (element) {
            element.addClass('selected');
            this.description.innerHTML = element.getElement('i').get('text');
            this.selectedPlaylistItemElement = element;
        },
        deselectAll: function () {
            if (this.selectedPlaylistItemElement) {
                this.selectedPlaylistItemElement.removeClass('selected');
            }
        }
    });
});
