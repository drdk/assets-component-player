define("dr-media-gemius-implementation-test", ["gstream"], function () {
    "use strict";

    /*jshint mootools:true, browser:true, devel:false */
    /*global gemiusStream */

    /**
    * Gemius implementation.
    * Requires following player options:
    * options.videoData.materialIdentifier    -    unique content ID
    * options.videoData.programmeName        -    Human readable content title
    * options.appData.autoPlay                        -    Bool
    * options.videoData.videoType                    -    "ondemand" or "live"
    */
    var GemiusImplementationTest = new Class({
        newStreamRegistered: false,
        isSeeking: false,
        initialAutoPlay: false,
        isPlaying: false,
        isBuffering: false,
        isIgnoringBuffer: false,
        lastEvent: null,
        /**
         * Instance of an AbstractPlayer. IE. Html5Player or FlashPlayer
         * @type {AbstractPlayer}
         */
        player: null,
        /**
         * @param  {AbstractPlayer} player Instance of an AbstractPlayer. IE. Html5Player or FlashPlayer
         * @constructor
         */
        initialize: function (player) {
            this.player = player;
            this.player.options.appData.gemius.playerId = 'global-assets-player_' + Math.round(Math.random() * 1000000);
            this.initialAutoPlay = this.player.options.appData.autoPlay;


            this.player.addEvent('play', this.onPlay.bind(this));
            this.player.addEvent('pause', this.onPause.bind(this));
            this.player.addEvent('stop', this.onStop.bind(this));
            this.player.addEvent('buffering', this.onBuffering.bind(this));
            this.player.addEvent('bufferingComplete', this.onBufferingComplete.bind(this));
            this.player.addEvent('beforeSeek', this.onBeforeSeek.bind(this));
            this.player.addEvent('afterSeek', this.onAfterSeek.bind(this));
            this.player.addEvent('complete', this.onComplete.bind(this));
            this.player.addEvent('changeChannel', this.closeStream.bind(this));
            this.player.addEvent('changeContent', this.closeStream.bind(this));
            this.player.addEvent('clearContent', this.closeStream.bind(this));
        },
        /**
         * Collects meta data values from player and creates a customPackage for gemius
         * @private
         */
        newStream: function () {

            var newStreamWithResource = function() {
                var treeId, customPackage, totalTime,
                    videoData = this.player.options.videoData,
                    appData = this.player.options.appData;

                customPackage = this.getCustomPackage();

                totalTime = this.getTotalTime();

                this.setMaterialIdentifier();

                treeId = [];
                
                gemiusStream.newStream(
                    this.player.options.appData.gemius.playerId,
                    this.player.options.appData.gemius.drIdentifier + this.player.options.videoData.materialIdentifier,
                    totalTime,
                    customPackage,
                    [],
                    this.player.options.appData.gemius.identifier,
                    this.player.options.appData.gemius.hitcollector,
                    treeId
                );
            }.bind(this);
            if (this.player.options.videoData.videoType === 'ondemand') {
                this.player.ensureResource(newStreamWithResource);
            } else {
                this.player.ensureLiveStreams(newStreamWithResource);
            }
        },
        getCustomPackage: function() {
            var pack = [
                { 'name': 'AUTOSTART', 'value': (this.initialAutoPlay ? "YES" : "NO") },
                { 'name': 'URL', 'value': encodeURIComponent(document.location.pathname) },
                { 'name': 'PLATFORM', 'value': Browser.Platform.name },
                { 'name': 'DR-CHANNEL', 'value': this.getChannelId() },
                { 'name': 'PRODUCTIONNUMBER', 'value': this.getProductionNumber() },
                { 'name': 'FORMAT', 'value': this.getStreamFormat() }
            ];

            return pack;
        },
        getTotalTime: function() {
            if (this.player.options.videoData.videoType == 'live') {
                return -1;
            } else {
                return this.player.duration();
            }
        },
        getProductionNumber: function() {
            if (this.player.hasResource()) {
                return this.player.productionNumber()
            } else {
                return '00000000000';
            }
        },
        getStreamFormat: function() {
            if (this.player.options.videoData.videoType == 'live') {
                return 'live';
            }

            return this.getODClipType();
        },
        getODClipType: function () {
            return this.player.productionNumber() !== '' ? 'OD' : 'Clip';
        },
        setMaterialIdentifier: function() {
            var namePrefix = 'test_';
            if (this.player.options.videoData.materialIdentifier == 'unknown' && this.player.hasResource()) {
                this.player.options.videoData.materialIdentifier = this.player.resourceSlug();
            }

            if (this.player.options.videoData.channelId) {
                this.player.options.videoData.materialIdentifier = this.player.options.videoData.channelId;
            } else if (!this.player.options.videoData.materialIdentifier && this.player.hasResource() && this.player.productionNumber()) {
                this.player.options.videoData.materialIdentifier = this.player.productionNumber();
            }

            this.player.options.videoData.materialIdentifier = namePrefix + this.player.options.videoData.materialIdentifier;
        },
        getChannelId: function () {
            if (this.player.options.videoData.videoType == 'live') {
                return this.player.options.videoData.channelId.toLowerCase();
            }

            if (this.player.resourceResult && this.player.resourceResult.broadcastChannel) {
                return this.player.resourceResult.broadcastChannel.toLowerCase();
            } 

            if (this.player.programcardResult) {
                return this.player.programcardResult.PrimaryChannel.split('/').pop().toLowerCase();
            }

            return this.player.options.appData.gemius.channelName;
        },
        /**
         * @private
         */
        testForNewStream: function () {
            if (!this.newStreamRegistered) {
                this.newStreamRegistered = true;
                this.newStream();
            }
        },
        /**
         * @private
         */
        gemiusEvent: function (type, position) {

            position = Math.round(position || this.player.position());

            // ignore playing and buffering events at the end of the content
            gemiusStream.event(
                this.player.options.appData.gemius.playerId,
                this.player.options.appData.gemius.drIdentifier + this.player.options.videoData.materialIdentifier,
                position,
                type
            );
            //console.log('gemius:gemiusEvent', type + " " + position);
            this.lastEvent = type;
        },
        /**
         * @private
         */
        onPlay: function () {
            this.testForNewStream();
            if (this.lastEvent != 'playing' && !this.isSeeking  && !this.isBuffering) {
                this.gemiusEvent('playing');
            }
            this.isPlaying = true;
        },
        /**
         * @private
         */
        onPause: function () {
            if (this.player.options.videoData.videoType == 'live') {
                // live streams can not pause in gemius
                this.gemiusEvent('stopped');
            } else {
                this.gemiusEvent('paused');
            }
            this.isPlaying = false;
        },
        /**
         * @private
         */
        onStop: function () {
            this.gemiusEvent('stopped');
            this.isPlaying = false;
        },
        /**
         * @private
         */
        onBuffering: function () {
            //console.log('gemius:onBuffering', this.isIgnoringBuffer);
            if (!this.isIgnoringBuffer) {
                this.testForNewStream();
                this.gemiusEvent('buffering');
                this.isBuffering = true;
            } else {
                this.isIgnoringBuffer = false;
            }
        },
        /**
         * @private
         */
        onBufferingComplete: function () {
            this.isBuffering = false;

            if (this.player.options.videoData.videoType === 'ondemand') {
                this.isIgnoringBuffer = true;
                //console.log('gemius:gemiusEvent', 'ignoring buffer event at the end of content');
            }

            if (this.isPlaying && !this.isSeeking) {
                // gemius need a 'playing' event after 'buffering' event 
                // if the player was playing before it started buffering
                this.gemiusEvent('playing');
            }
        },
        /**
         * @private
         */
        onBeforeSeek: function (position) {
            if (!this.isSeeking) {
                this.gemiusEvent('seekingStarted', position);
            }
            this.isSeeking = true; //prevent unwanted play gemius-event
        },
        /**
         * @private
         */
        onAfterSeek: function () {
            this.isSeeking = false;
            if (this.isPlaying && !this.isBuffering) {
                // gemius need a 'playing' event after 'seekingStarted' event 
                // if the player was playing before it started buffering
                this.gemiusEvent('playing');
            }
        },
        /**
         * @private
         */
        onComplete: function () {
            this.gemiusEvent('complete');
            this.closeStream();
            this.isPlaying = false;
        },
        /**
         * @private
         */
        closeStream: function () {
            if (this.newStreamRegistered) {
                gemiusStream.closeStream(
                    this.player.options.appData.gemius.playerId,
                    this.player.options.appData.gemius.drIdentifier + this.player.options.videoData.materialIdentifier,
                    this.player.position()
                );
                this.newStreamRegistered = false;
            }
        }
    });
    return GemiusImplementationTest;
});