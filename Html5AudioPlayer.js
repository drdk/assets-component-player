/* jshint devel: true */
/* global define: true, MediaError: true */

define('dr-media-html5-audio-player', ['dr-media-class', 'dr-media-audio-player', 'dr-widget-media-dom-helper'], function (MediaClass, AudioPlayer, DomHelper) {

    'use strict';

    function Html5AudioPlayer (options) {
        AudioPlayer.call(this, options);
        this.setOptions({
            defaultQuality: -1,
            appData: {
                linkType: 'Download', // meh???
                fileType: 'mp3'
            }
        });
        if (options) {
            this.setOptions(options);
        }

        console.log('Html5AudioPlayer constructor');
    }
    MediaClass.inheritance(Html5AudioPlayer, AudioPlayer);
        
    Html5AudioPlayer.prototype.build= function () {
        if (this.options.videoData.videoType === 'ondemand') {
            this.ensureResource(this.postBuild, this);
        } else {
            this.ensureLiveStreams(this.postBuild, this);
        }
        AudioPlayer.prototype.build.call(this);
    };

    Html5AudioPlayer.prototype.postBuild= function () {
        var container = this.options.element;
        var sources = this.getHttpStreams(this.options.appData.defaultQuality);

        this.audioElement = DomHelper.newElement('audio', {
            hidden: true,
            preload: 'metadata'
        });

        for (var i = 0; i < sources.length; i++) {
            var s = sources[i];
            this.audioElement.appendChild(DomHelper.newElement('source', { src: s.uri }));
        }

        container.appendChild(this.audioElement);
        // this.audioElement.inject(container, 'top');

        this.initializeEvents();
    };

    Html5AudioPlayer.prototype._getOndemandHttpStreams= function (quality) {
        var links = this.links();
        var streams = [];
        for (var ii = 0; ii < links.length; ii++) {
            var link = links[ii];
            streams.push({ uri: link.uri, kbps: link.bitrateKbps, linkType: link.linkType });
        }
        streams.sort(function (a,b) { return Math.abs(quality - a.kbps) - Math.abs(quality - b.kbps); });

        var sortedStreams = [];
        for (var i = 0; i < streams.length; i++) {
            var s = streams[i];
            if (s.linkType.toLowerCase() === 'hls') {
                sortedStreams.push(s);
            }
        }

        // If a HLS server was found we should use this
        if (sortedStreams.length > 0) {
            console.log('quality: ' + quality);
            this.setBitratesAvailable(this.getBitratesFromODStream(sortedStreams[0]));
            for (var i=0; i < this.bitratesAvailable.length; i++) {
                console.log('bitrate ' + this.bitratesAvailable[i].bitrate + ': ' + this.bitratesAvailable[i].uri);
            }
            sortedStreams = [this.getStreamByBitrate(quality)];
            console.log('selected bitrate: ' + sortedStreams[0].bitrate + '(' + sortedStreams[0].uri + ')');
        } else {
            // We land here if no HLS servers were found. Use all servers in list, except HDS
            sortedStreams = [];
            for (var j = 0; j < streams.length; j++) {
                var os = streams[j];
                if (os.linkType.toLowerCase() !== 'hds') {
                    sortedStreams.push(os);
                }
            }
        }

        var result = [];
        for (var k = 0; k < sortedStreams.length; k++) {
            var rs = sortedStreams[k];
            if (rs.uri.match(/^http:/i)) {
                result.push(rs);
            }
        }

        return result;

        // return sortedStreams
            // .map(function (s) { return s; })
            // .filter(function (s) { return s.uri.match(/^http:/i); });
    };

    Html5AudioPlayer.prototype._getLiveHttpStreams= function (quality) {
        var servers = this.getChannel().servers;
        var hlsStreams = [];
        var notHdsStreams = [];
        for (var i = 0; i < servers.length; i++) {
            var s = servers[i];
            var qualities = [];
            for (var j = 0; j < s.qualities.length; j++) {
                var q = s.qualities[j];
                for (var k = 0; k < q.streams.length; k++) {
                    var n = q.streams[k];
                    qualities.push({ uri: s.server.replace(/\/+$/, '') + '/' + n, kbps: q.kbps, linkType: s.linkType });
                }
            }
            qualities.sort(function (a,b) { return Math.abs(quality - a.kbps) - Math.abs(quality - b.kbps); });
            var qs = qualities[0];
            if (qs.linkType.toLowerCase() === 'hls') {
                hlsStreams.push(qs);
            } 
            if (qs.uri.match(/^http:/i) && qs.linkType.toLowerCase() !== 'hds') {
                notHdsStreams.push(qs);
            }
        }
        // If no HLS servers were found, use all other except HDS
        if (hlsStreams.length === 0) {
            return notHdsStreams;
        } else {
            return hlsStreams;
        }
    };

    Html5AudioPlayer.prototype.getHttpStreams = function (quality) {
        console.log('getHttpStreams(' + quality + ')');
        var streams;

        if (this.options.videoData.videoType === 'ondemand') {
            streams = this._getOndemandHttpStreams(quality);
        } else {
            streams = this._getLiveHttpStreams(quality);
        }

        // TODO: remove unique streams
        console.log('streams: ' + streams);

        return streams;
    };

    Html5AudioPlayer.prototype.setNewBitrate = function(bitrate) {
        AudioPlayer.prototype.setNewBitrate.call(this, bitrate);

        var sources = this.getHttpStreams(this.options.appData.defaultQuality);

        while(this.audioElement.firstChild) {
            this.audioElement.removeChild(this.audioElement.firstChild);
        }
        
        for (var i = 0; i < sources.length; i++) {
            var s = sources[i];
            this.audioElement.appendChild(DomHelper.newElement('source', { src: s.uri }));
        }

        if (this.targetTimeCode) {
            this.seek(this.targetTimeCode);
        }
    };

    // TODO: candidate for merge with videoplayer
    Html5AudioPlayer.prototype.initializeEvents = function () {
        this.audioElement.addEventListener('play', this.onPlay.bind(this), false);
        this.audioElement.addEventListener('pause', this.onPause.bind(this), false);
        this.audioElement.addEventListener('seeking', this.onBeforeSeek.bind(this), false);
        this.audioElement.addEventListener('seeked', this.onAfterSeek.bind(this), false);
        this.audioElement.addEventListener('ended', this.onComplete.bind(this), false);
        this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this), false);
        this.audioElement.addEventListener('loadedmetadata', this.onDurationChange.bind(this), false);
        this.audioElement.addEventListener('volumechange', this.onVolumeChange.bind(this), false);
        this.audioElement.addEventListener('loadstart', this.onLoadStart.bind(this), false);
        this.audioElement.addEventListener('error', this.onError.bind(this), false);

        // debugging
        this.audioElement.addEventListener('play', function () { console.log('> play'); }, false);
        this.audioElement.addEventListener('pause', function () { console.log('> pause'); }, false);
        this.audioElement.addEventListener('seeking', function () { console.log('> seeking'); }, false);
        this.audioElement.addEventListener('seeked', function () { console.log('> seeked'); }, false);
        this.audioElement.addEventListener('stalled', function () { console.log('> stalled'); }, false);
        this.audioElement.addEventListener('loadstart', function () { console.log('> loadstart'); }, false);
        this.audioElement.addEventListener('loadedmetadata', function () { console.log('> loadedmetadata'); }, false);
        this.audioElement.addEventListener('durationchange', function () { console.log('> durationchange'); }, false);
        this.audioElement.addEventListener('error', function () { console.log('> error'); }, false);
    };

    Html5AudioPlayer.prototype.onLoadStart = function () {
        this.ready();
    };

    Html5AudioPlayer.prototype.onTimeUpdate = function() {
        this.lastCurrentTime = this.audioElement.currentTime;
        this.onProgressChange();
    };

    Html5AudioPlayer.prototype.onVolumeChange= function () {
        this.fireEvent('volumechange');
    };

    Html5AudioPlayer.prototype.onError= function (e) {
        if (e.target.error.code === MediaError.prototype.MEDIA_ERR_ABORTED) { // 1
            this.displayError('defaultMsg', 'MEDIA_ERR_ABORTED: The fetching process for the media resource was aborted by the user agent at the users request');
        } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_NETWORK) { // 2
            this.displayError('defaultMsg', 'MEDIA_ERR_NETWORK: A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable');
        } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_DECODE) { // 3
            this.displayError('defaultMsg', 'MEDIA_ERR_DECODE: An error of some description occurred while decoding the media resource, after the resource was established to be usable');
        } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_SRC_NOT_SUPPORTED) { // 4
            this.displayError('defaultMsg', 'MEDIA_ERR_SRC_NOT_SUPPORTED: The video could not be loaded the format is not supported');
        } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_ENCRYPTED) { // 5
            this.displayError('defaultMsg', 'MEDIA_ERR_ENCRYPTED');
        } else {
            this.displayError('defaultMsg', 'unknown error');
        }
    };

    Html5AudioPlayer.prototype.onBeforeSeek= function () {
        var pos = this.lastCurrentTime || this.audioElement.currentTime;
        AudioPlayer.prototype.onBeforeSeek.call(this, pos);
        this.onBuffering(pos);
    };

    Html5AudioPlayer.prototype.onAfterSeek= function () {
        var pos = this.audioElement.currentTime;
        this.onBufferingComplete(pos);
        AudioPlayer.prototype.onAfterSeek.call(this, pos);
    };

    Html5AudioPlayer.prototype.play= function () {
        console.log(':play()');
        this.audioElement.play();
        if (!this.audioElement.paused) {
            //player must dispatch a play event, even if the player is allready playing
            this.onPlay();
        }
    };

    Html5AudioPlayer.prototype.pause= function () {
        console.log(':pause()');
        this.audioElement.pause();
    };

    Html5AudioPlayer.prototype.stop= function () {
        console.log(':stop()');
        this.audioElement.stop();
    };

    Html5AudioPlayer.prototype.progress= function () {
        return this.position() / this.duration(); // current position in timeline in percent (Number between 0 and 1).
    };

    Html5AudioPlayer.prototype.position= function () {
        return this.audioElement ? this.audioElement.currentTime : 0;
    };

    Html5AudioPlayer.prototype.duration= function () {
        var parent = AudioPlayer.prototype.duration.call(this);
        if (parent !== 0) {
            return parent;
        } else if (this.audioElement) {
            return this.audioElement.duration;
        }
        return 0;
    };

    Html5AudioPlayer.prototype.volume= function () {
        if (this.audioElement) {
            if (this.audioElement.muted) {
                return 0;
            } else {
                return this.audioElement.volume;
            }
        }
        return 0.7;
    };

    Html5AudioPlayer.prototype.setVolume= function (volume) {
        if (this.audioElement)
            this.audioElement.volume = volume;
    };
       
    Html5AudioPlayer.prototype._seek= function (value) {
        var seconds;
        if (typeof(value) === 'string') {
            seconds = this.timeCodeConverter.timeCodeToSeconds(value);
        } else {
            seconds = value * this.duration();
        }
        if (this.audioElement) {
            try {
                this.audioElement.currentTime = seconds;
                this.play();
            } catch (exception) {
                // suppress this exception - forceseeking will handle it
            }
        }
        return false;
    };

    return Html5AudioPlayer;
});
