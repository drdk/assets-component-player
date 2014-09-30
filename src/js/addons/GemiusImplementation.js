/* jshint devel: true */
/* global define: true */

   define('dr-media-gemius-implementation', ['gstream'], function () {
    'use strict';

    /*jshint mootools:true, browser:true, devel:false */
    /*global gemiusStream */

    /**
    * Gemius implementation.
    * Requires following player options:
    * options.videoData.materialIdentifier    -    unique content ID
    * options.videoData.programmeName        -    Human readable content title
    * options.appData.autoPlay                        -    Bool
    * options.videoData.videoType                    -    'ondemand' or 'live'
    */
    var GemiusImplementation = function (player) {

        var self = this;

        self.newStreamRegistered = false;
        self.isSeeking = false;
        self.initialAutoPlay = false;
        self.isPlaying = false;
        self.isBuffering = false;
        self.isIgnoringBuffer = false;
        self.lastEvent = null;
        self.streamId = null;
        /**
         * Instance of an AbstractPlayer. IE. Html5Player or FlashPlayer
         * @type {AbstractPlayer}
         */        
        self.player = (player) ? player : null;
        /**
         * @param  {AbstractPlayer} player Instance of an AbstractPlayer. IE. Html5Player or FlashPlayer
         * @constructor
         */

        self.player.options.appData.gemius.playerId = 'global-assets-player_' + Math.round(Math.random() * 1000000);
        self.initialAutoPlay = self.player.options.appData.autoPlay;


        function newStream () {

            var newStreamWithResource = function() {
                var treeId, customPackage, totalTime,
                    videoData = self.player.options.videoData,
                    appData = self.player.options.appData;

                customPackage = [
                    { 'name': 'AUTOSTART', 'value': (self.initialAutoPlay ? 'YES' : 'NO') },
                    { 'name': 'URL', 'value': encodeURIComponent(document.location.pathname) },
                    { 'name': 'PLATFORM', 'value': getPlatformName() },
                    { 'name': 'CHANNEL', 'value': self.player.options.appData.gemius.channelName }
                ];
                if (self.player.options.videoData.videoType == 'live') {
                    totalTime = -1;
                } else {
                    totalTime = self.player.duration();
                }
                if (self.player.hasResource()) {
                    customPackage.push({ 'name': 'PRODUCTIONNUMBER', 'value': self.player.productionNumber() });
                    customPackage.push({ 'name': 'PROGRAMME', 'value': self.player.resourceName() });
                }
                if (self.player.options.videoData.materialIdentifier == 'unknown' && self.player.hasResource()) {
                    self.player.options.videoData.materialIdentifier = self.player.resourceSlug();
                }
                if (self.player.options.videoData.channelId) {
                    customPackage.push({ 'name': 'PROGRAMME', 'value': self.player.options.videoData.channelId });
                    customPackage.push({ 'name': 'PRODUCTIONNUMBER', 'value': '00000000000' });
                    self.player.options.videoData.materialIdentifier = self.player.options.videoData.channelId;
                } else if (!self.player.options.videoData.materialIdentifier && self.player.hasResource() && self.player.productionNumber()) {
                    self.player.options.videoData.materialIdentifier = self.player.productionNumber();
                }
                
                treeId = [];
                self.streamId = self.player.options.appData.gemius.drIdentifier + self.player.options.videoData.materialIdentifier;

                gemiusStream.newStream(
                    self.player.options.appData.gemius.playerId,
                    self.streamId,
                    totalTime,
                    customPackage,
                    [],
                    self.player.options.appData.gemius.identifier,
                    self.player.options.appData.gemius.hitcollector,
                    treeId
                );
            };

            if (self.player.options.videoData.videoType === 'ondemand') {
                self.player.ensureResource(newStreamWithResource);
            } else {
                self.player.ensureLiveStreams(newStreamWithResource);
            }
        }

        function getPlatformName() {
            var ua = window.navigator.userAgent, platform = window.navigator.platform || '';
            ua = ua.toLowerCase();
            return ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.toLowerCase().match(/mac|win|linux/) || ['other'])[0];
        }

        function testForNewStream () {
            if (!self.newStreamRegistered) {
                self.newStreamRegistered = true;
                newStream();
            }
        }

        function dispatchPlayEvent (position) {
            //console.log('dispatchPlayEvent -> self.lastEvent: ' + self.lastEvent + ' || self.isSeeking: ' + self.isSeeking + ' || self.isBuffering: ' + self.isBuffering);
            if (self.lastEvent != 'playing' && !self.isSeeking  && !self.isBuffering) {
                gemiusEvent('playing', position);
            }
        }

        function gemiusEvent (type, position) {
            position = Math.round(position || self.player.position());

            if (!((type == 'playing' || type == 'buffering') && parseInt(position) == parseInt(self.player.duration()) && self.player.options.videoData.videoType == 'ondemand')){
                // ignore playing and buffering events at the end of the content
                gemiusStream.event(
                    self.player.options.appData.gemius.playerId,
                    self.player.options.appData.gemius.drIdentifier + self.player.options.videoData.materialIdentifier,
                    position,
                    type
                );
                // if (window.console && console.log) console.log('gemius:gemiusEvent', type + ' ' + position);
            } else {
                // if (window.console && console.log) console.log('ignoring ' + type + ' event at the end of content');
            }
            self.lastEvent = type;
        }

        function onPlay () {
            testForNewStream();
            
            dispatchPlayEvent();

            self.isPlaying = true;
        }

        function onPause () {
            if (self.player.options.videoData.videoType == 'live') {
                // live streams can not pause in gemius
                gemiusEvent('stopped');
            } else {
                gemiusEvent('paused');
            }
            self.isPlaying = false;
        }

        function onStop () {
            gemiusEvent('stopped');
            self.isPlaying = false;
        }

        function onBuffering () {
            testForNewStream();
            gemiusEvent('buffering');
            self.isBuffering = true;
        }

        function onBufferingComplete () {
            self.isBuffering = false;

            if (self.isPlaying) {
                // gemius need a 'playing' event after 'buffering' event 
                // if the player was playing before it started buffering
                dispatchPlayEvent();
            }
        }        

        function onBeforeSeek (position) {
            if (!self.isSeeking) {
                gemiusEvent('seekingStarted');
            }

            self.seekTarget = position;
            self.isSeeking = true; //prevent unwanted play gemius-event
        }

        function onAfterSeek (position) {
            self.isSeeking = false;
            if (self.isPlaying) {
                // gemius need a 'playing' event after 'seekingStarted' event 
                // if the player was playing before it started buffering

                if (self.seekTarget) {
                    position = self.seekTarget;
                    self.seekTarget = null;
                }

                dispatchPlayEvent(position);
            }
        }

        function onComplete () {
            gemiusEvent('complete');
            closeStream();
            self.isPlaying = false;
        }

        function closeStream () {
            self.isPlaying = false;
            self.lastEvent = null;

            if (self.newStreamRegistered) {
                gemiusStream.closeStream(
                    self.player.options.appData.gemius.playerId,
                    self.streamId,
                    self.player.position()
                );
                self.newStreamRegistered = false;
            }
        }

        function onChangeChannel() {
            self.player.options.videoData.materialIdentifier = 'unknown';

            closeStream();
        }
        
        function onChangeContent() {
            self.player.options.videoData.materialIdentifier = 'unknown';

            closeStream();
        }
        
        function onClearContent() {
            self.player.options.videoData.materialIdentifier = 'unknown';

            closeStream();
        }

        self.player.addEvent('play', onPlay);
        self.player.addEvent('pause', onPause);
        self.player.addEvent('stop', onStop);
        self.player.addEvent('buffering', onBuffering);
        self.player.addEvent('bufferingComplete', onBufferingComplete);
        self.player.addEvent('beforeSeek', onBeforeSeek);
        self.player.addEvent('afterSeek', onAfterSeek);
        self.player.addEvent('complete', onComplete);
        self.player.addEvent('changeChannel', onChangeChannel);
        self.player.addEvent('changeContent', onChangeContent);
        self.player.addEvent('clearContent', onClearContent);

    };

    return GemiusImplementation;
});
