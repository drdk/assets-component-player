/*jshint mootools:true,browser:true,devel:true */
/**
* @name Media Playlist
* @fileOverview 
*/

/**
* Creates an instance of a audio and/or video player and playlist. 
* The element must contain a .player tag and at least one a.playlist-item tag 
* with a  data-resource attribute refering to the GetResource
* service. IE: http://www.dr.dk/handlers/GetResource.ashx?id=1136684
* <pre><code>
* <div class="dr-widget-media-playlist">
*    <div class="player"></div>
*    <ol>
*        <li><a href="#" data-resource="http://www.dr.dk/handlers/GetResource.ashx?id=1136684">item 1</a></li>
*    </ol>
* </div>
* </code></pre>
* Optional attributes:
* data-gchannel Custom Gemius channel metadata
*/
define("dr-widget-media-playlist", ["dr-media-player-factory"], function (PlayerFactory) {
    "use strict";
    return new Class({
        element: null,
        playlistItemElements: null,
        mediaContainerElement: null,
        mediaPlayer: null,
        selectedPlaylistItemElement: null,
        initialize: function (element) {
        	this.element = element;
        	this.element.store("instance", this);
            this.mediaContainerElement = element.getElement('.player');
            this.playlistItemElements = element.getElements('.playlist-item');
			this.description = element.getElement('figcaption');
			this.initializePlaylistEvent();
			this.selectDefault();
            this.build(false);
        },
        initializePlaylistEvent: function () {
        	this.element.addEvent('click:relay(a.playlist-item)', this.itemClickHandler.bind(this));
        },
        selectDefault: function () {
 			var defaultSelection = this.element.getElement('.playlist-item.selected');
            if (!defaultSelection) {
                defaultSelection = this.playlistItemElements[0];
            }

            if (defaultSelection)
                this.selectItem(defaultSelection);
        },
        build: function (autoPlay) {
        	if (this.mediaPlayer) {
                this.mediaPlayer.clearContent();
        	}
          	this.mediaPlayer = PlayerFactory.getPlayer({
                'element': this.mediaContainerElement,
                'videoData': {
                    'videoType': (this.selectedPlaylistItemElement.get('data-channel') ? 'live' : 'ondemand'),
                    'resource': this.selectedPlaylistItemElement.get('data-resource'),
                    'image': this.selectedPlaylistItemElement.get('data-image'),
                    'channelId': this.selectedPlaylistItemElement.get('data-channel')
                },
                'appData': {
                    'autoPlay': (autoPlay || this.element.get('data-autoplay') == 'true'),
                    'gemius': {
                        'channelName': (this.element.get('data-gchannel') ? this.element.get('data-gchannel') : 'drdk')
                    }
                },
                'type': this.selectedPlaylistItemElement.get('data-type')
            });
            this.mediaPlayer.options.element.set('class', 'player ' + this.selectedPlaylistItemElement.get('data-type'));
            this.mediaPlayer.options.element.set('style', '');	
        },
        itemClickHandler: function (event, selectedElement) {
            event.preventDefault();
            this.deselectAll();
            this.selectItem(selectedElement);
            this.build(true);
        },
        selectItem: function (element) {
            element.addClass('selected');
			this.description.set('text', element.getElement('i').get('text'));
            this.selectedPlaylistItemElement = element;
        },
        deselectAll: function () {
            if (this.selectedPlaylistItemElement) {
                this.selectedPlaylistItemElement.removeClass('selected');
            }
        },
        getSelectedItem: function () {

        }
    });
});