define("dr-media-html5-audio-player", ['dr-media-audio-player'], function (AudioPlayer) {

    /*jshint mootools:true,browser:true,devel:true */
    /*global MediaError */
    "use strict";

    // var Html5AudioPlayer = new Class({
    //     Extends: AudioPlayer,
    //     options: {
    //         defaultQuality: -1,
    //         appData: {
    //             linkType: 'Download', // meh???
    //             fileType: 'mp3'
    //         }
    //     },
    //     build: function () {
    //         if (this.options.videoData.videoType === 'ondemand') {
    //             this.ensureResource(this.postBuild, this);
    //         } else {
    //             this.ensureLiveStreams(this.postBuild, this);
    //         }
    //         this.parent();
    //     },

    //     postBuild: function () {
    //         var container = this.options.element;
    //         var sources = this.getHttpStreams(this.options.appData.defaultQuality);

    //         this.audioElement = new Element('audio', {
    //             hidden: true,
    //             preload: 'metadata'
    //         }).adopt(sources.map(function (s) { return new Element('source', { src: s.uri }); }));

    //         this.audioElement.inject(container, 'top');

    //         this.initializeEvents();
    //     },

    //     _getOndemandHttpStreams: function (quality) {
    //         var streams = this.links().map(function (s) {
    //             return { uri: s.uri, kbps: s.bitrateKbps, linkType: s.linkType };
    //         });
    //         streams.sort(function (a,b) { return Math.abs(quality - a.kbps) - Math.abs(quality - b.kbps); });

    //         var sortedStreams = streams.filter(function(s) { return s.linkType.toLowerCase() === 'hls'})

    //         // If a HLS server was found we should use this
    //         if (sortedStreams.length > 0) {
    //             console.log('quality: ' + quality);
    //             this.setBitratesAvailable(this.getBitratesFromODStream(sortedStreams[0]));
    //             for (var i=0; i < this.bitratesAvailable.length; i++) {
    //                 console.log('bitrate ' + this.bitratesAvailable[i].bitrate + ': ' + this.bitratesAvailable[i].uri);
    //             }
    //             sortedStreams = [this.getStreamByBitrate(quality)];
    //             console.log('selected bitrate: ' + sortedStreams[0].bitrate + '(' + sortedStreams[0].uri + ')');
    //         } else {
    //             // We land here if no HLS servers were found. Use all servers in list, except HDS
    //             sortedStreams = streams.filter(function(s) { return s.linkType.toLowerCase() !== 'hds'})
    //         }

    //         return sortedStreams
    //             .map(function (s) { return s; })
    //             .filter(function (s) { return s.uri.match(/^http:/i); });
    //     },

    //     _getLiveHttpStreams: function (quality) {
    //         var servers = this.getChannel().servers;

    //         var streams = servers.map(function (s) {
    //             var qualities = s.qualities.map(function (q) {
    //                 return q.streams.map(function (n) {
    //                     return { uri: s.server.replace(/\/+$/, '') + '/' + n, kbps: q.kbps, linkType: s.linkType };
    //                 });
    //             }).flatten();

    //             // only get streams of matching quality
    //             qualities.sort(function (a,b) { return Math.abs(quality - a.kbps) - Math.abs(quality - b.kbps); });
    //             return qualities[0];
    //         }).filter(function (s) { return s.linkType.toLowerCase() === 'hls'; });
            
    //         // If no HLS servers were found, use all other except HDS
    //         if (streams.length === 0) {
    //             streams = servers.map(function (s) {
    //                 var qualities = s.qualities.map(function (q) {
    //                     return q.streams.map(function (n) {
    //                         return { uri: s.server.replace(/\/+$/, '') + '/' + n, kbps: q.kbps, linkType: s.linkType };
    //                     });
    //                 }).flatten();

    //                 // only get streams of matching quality
    //                 qualities.sort(function (a,b) { return Math.abs(quality - a.kbps) - Math.abs(quality - b.kbps); });
    //                 return qualities[0];
    //             }).filter(function (s) { return s.uri.match(/^http:/i) && s.linkType.toLowerCase() !== 'hds'; });
    //         }
            
    //         return streams;
    //     },
    //     getHttpStreams: function (quality) {
    //         console.log('getHttpStreams(' + quality + ')');
    //         var streams;

    //         if (this.options.videoData.videoType === 'ondemand') {
    //             streams = this._getOndemandHttpStreams(quality);
    //         } else {
    //             streams = this._getLiveHttpStreams(quality);
    //         }

    //         // TODO: remove unique streams
    //         console.log('streams: ' + streams);

    //         return streams;
    //     },

    //     setNewBitrate: function(bitrate) {
    //         this.parent(bitrate);

    //         var sources = this.getHttpStreams(this.options.appData.defaultQuality);

    //         this.audioElement.getElement('source').destroy();
            
    //         this.audioElement.adopt(sources.map(function (s) { return new Element('source', { src: s.uri }); }));
    //         //this.play();

    //         if (this.targetTimeCode) this.seek(this.targetTimeCode);
    //     },

    //     // TODO: candidate for merge with videoplayer
    //     initializeEvents: function () {
    //         this.audioElement.addEventListener('play', this.onPlay.bind(this), false);
    //         this.audioElement.addEventListener('pause', this.onPause.bind(this), false);
    //         this.audioElement.addEventListener('seeking', this.onBeforeSeek.bind(this), false);
    //         this.audioElement.addEventListener('seeked', this.onAfterSeek.bind(this), false);
    //         this.audioElement.addEventListener('ended', this.onComplete.bind(this), false);
    //         this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this), false);
    //         this.audioElement.addEventListener('loadedmetadata', this.onDurationChange.bind(this), false);
    //         this.audioElement.addEventListener('volumechange', this.onVolumeChange.bind(this), false);
    //         this.audioElement.addEventListener('loadstart', this.onLoadStart.bind(this), false);
    //         this.audioElement.addEventListener('error', this.onError.bind(this), false);

    //         // debugging
    //         this.audioElement.addEventListener('play', function () { console.log('> play'); }, false);
    //         this.audioElement.addEventListener('pause', function () { console.log('> pause'); }, false);
    //         this.audioElement.addEventListener('seeking', function () { console.log('> seeking'); }, false);
    //         this.audioElement.addEventListener('seeked', function () { console.log('> seeked'); }, false);
    //         this.audioElement.addEventListener('stalled', function () { console.log('> stalled'); }, false);
    //         this.audioElement.addEventListener('loadstart', function () { console.log('> loadstart'); }, false);
    //         this.audioElement.addEventListener('loadedmetadata', function () { console.log('> loadedmetadata'); }, false);
    //         this.audioElement.addEventListener('durationchange', function () { console.log('> durationchange'); }, false);
    //         this.audioElement.addEventListener('error', function () { console.log('> error'); }, false);
    //     },

    //     onLoadStart: function () {
    //         this.ready();
    //     },

    //     onTimeUpdate: function() {
    //         this.lastCurrentTime = this.audioElement.currentTime;
    //         this.onProgressChange();
    //     },

    //     onVolumeChange: function () {
    //         this.fireEvent('volumechange');
    //     },
    //     onError: function (e) {
    //         if (e.target.error.code === MediaError.prototype.MEDIA_ERR_ABORTED) { // 1
    //             this.displayError('defaultMsg', 'MEDIA_ERR_ABORTED: The fetching process for the media resource was aborted by the user agent at the users request');
    //         } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_NETWORK) { // 2
    //             this.displayError('defaultMsg', 'MEDIA_ERR_NETWORK: A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable');
    //         } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_DECODE) { // 3
    //             this.displayError('defaultMsg', 'MEDIA_ERR_DECODE: An error of some description occurred while decoding the media resource, after the resource was established to be usable');
    //         } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_SRC_NOT_SUPPORTED) { // 4
    //             this.displayError('defaultMsg', 'MEDIA_ERR_SRC_NOT_SUPPORTED: The video could not be loaded the format is not supported');
    //         } else if (e.target.error.code === MediaError.prototype.MEDIA_ERR_ENCRYPTED) { // 5
    //             this.displayError('defaultMsg', 'MEDIA_ERR_ENCRYPTED');
    //         } else {
    //             this.displayError('defaultMsg', 'unknown error');
    //         }
    //     },

    //     onBeforeSeek: function () {
    //         var pos = this.lastCurrentTime || this.audioElement.currentTime;
    //         this.parent(pos);
    //         this.onBuffering(pos);
    //     },

    //     onAfterSeek: function () {
    //         var pos = this.audioElement.currentTime;
    //         this.onBufferingComplete(pos);
    //         this.parent(pos);
    //     },

    //     play: function () {
    //         console.log(':play()');
    //         this.audioElement.play();
    //         if (!this.audioElement.paused) {
    //             //player must dispatch a play event, even if the player is allready playing
    //             this.onPlay();
    //         }
    //     },

    //     pause: function () {
    //         console.log(':pause()');
    //         this.audioElement.pause();
    //     },
    //     stop: function () {
    //         console.log(':stop()');
    //         this.audioElement.stop();
    //     },
    //     progress: function () {
    //         return this.position() / this.duration(); // current position in timeline in percent (Number between 0 and 1).
    //     },
    //     position: function () {
    //         // if (this.seekWhenReady) {
    //         //     var fakePosition = 0;
    //         //     if (typeof(this.seekWhenReady) === 'string') {
    //         //        fakePosition = this.timeCodeConverter.timeCodeToSeconds(this.seekWhenReady);
    //         //     } else {
    //         //         fakePosition = this.seekWhenReady;
    //         //     }
    //         //     return fakePosition;
    //         // }
    //         return this.audioElement ? this.audioElement.currentTime : 0; // current position in timeline in seconds
    //     },
    //     duration: function () {
    //         if (this.parent() != 0) {
    //             return this.parent();
    //         } else if (this.audioElement) {
    //             return this.audioElement.duration;
    //         }
    //         return 0;
    //     },
    //     volume: function () {
    //         if (this.audioElement) {
    //             if (this.audioElement.muted) {
    //                 return 0;
    //             } else {
    //                 return this.audioElement.volume;
    //             }
    //         }
    //         return 0.7;
    //     },
    //     setVolume: function (volume) {
    //         if (this.audioElement)
    //             this.audioElement.volume = volume;
    //     },
    //     /**
    //      * @private
    //      */
    //     _seek: function (value) {
    //         var seconds;
    //         if (typeof(value) === 'string') {
    //             seconds = this.timeCodeConverter.timeCodeToSeconds(value);
    //         } else {
    //             seconds = value * this.duration();
    //         }
    //         if (this.audioElement) {
    //             try {
    //                 this.audioElement.currentTime = seconds;
    //                 this.play();
    //             } catch (exception) {
    //                 // suppress this exception - forceseeking will handle it
    //             }
    //         }
    //         return false;
    //     }
    // });
    // return Html5AudioPlayer;
    return {};
});
