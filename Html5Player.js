/* jshint devel: true */
/* global define: true, _gaq: true */

define('dr-media-html5-video-player', ['dr-media-video-player', 'dr-media-class', 'dr-widget-media-dom-helper'], function (VideoPlayer, MediaClass, DomHelper) {
    'use strict';


    function Html5Player (options) {

        VideoPlayer.call(this, options);
        
        this.setOptions({
            appData: {
                defaultQuality: 250,
                linkType: 'Ios',
                fileType: 'mp4'
            }
        });

        if (this.options) {
            this.setOptions(options);
        }

        this.buildPreview();

    }
    MediaClass.inheritance(Html5Player, VideoPlayer);
    
    Html5Player.prototype.updateOptions = function (options) {
        this.options.appData.autoPlay = true;
        VideoPlayer.prototype.updateOptions.call(this, options);
        this.build();
    };

    Html5Player.prototype.buildPreview = function () {
        //override AbstractPlayer.buildPreview:
        this.build();
    };
    
    Html5Player.prototype.build = function () {
        if (this.options.videoData.videoType === 'ondemand') {
            this.ensureResource(this.postBuild, this);
        } else {
            this.ensureLiveStreams(this.postBuild, this);
        }
        //this.parent();
        VideoPlayer.prototype.build.call(this);

    };

    Html5Player.prototype.initializeEvents = function () {
        this.videoElement.addEventListener('play', this.onPlay.bind(this), false);
        this.videoElement.addEventListener('pause', this.onPause.bind(this), false);
        this.videoElement.addEventListener('seeking', this.onBeforeSeek.bind(this), false);
        this.videoElement.addEventListener('seeked', this.onAfterSeek.bind(this), false);
        this.videoElement.addEventListener('ended', this.onComplete.bind(this), false);
        //this.videoElement.addEventListener('loadedmetadata', this.onMetaData.bind(this), false);
        this.videoElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this), false);
        this.videoElement.addEventListener('loadedmetadata', this.onDurationChange.bind(this), false);
        this.videoElement.addEventListener('loadedmetadata', this.onMetaDataLoaded.bind(this), false);
    };


    Html5Player.prototype.onBuffering = function () {
        this.fireEvent('buffering', this.position());
    };
    Html5Player.prototype.onBufferingComplete = function () {
        this.fireEvent('bufferingComplete', this.position());
    };
    Html5Player.prototype.onBeforeSeek = function () {
        this.fireEvent('beforeSeek', this.position());
    };
    Html5Player.prototype.onAfterSeek = function () {
        this.fireEvent('afterSeek', this.position());
    };

    Html5Player.prototype.onMetaDataLoaded = function () {
        //Fire click event
        if (typeof _gaq !== 'undefined') {
            _gaq.push(['_trackEvent', 'global-assets-video-player', 'click', 'play']);
        }
    };

    Html5Player.prototype.postBuild = function () {
        var src = this.getStream(this.options.appData.defaultQuality), poster;
        if (src === null || src.length === 0) {
            // MU will return a program card with no resource links if the user is not in DK
            if (this.links().length === 0) {
                this.queryGeofilter();
            } else {
                this.displayError('defaultMsg');
            }

            return;
        }
       
        if (this.options.videoData.image) {
            poster = this.options.videoData.image;
        } else {
            poster = this.getPosterImage();
        }
        this.videoElement = DomHelper.newElement('video', {
            'controls': 'controls',
            'poster': poster,
            'preload': 'none'
        });

        for (var i=0; i < src.length; i++) {
            var s = src[i],
                e = DomHelper.newElement('source', {
                    'src':s.stream,
                    'data-kbps':s.kbps
                });
            this.videoElement.appendChild(e);
        }

        //add error handling to last source element
        var numSources = this.videoElement.querySelectorAll('source').length;
        var player = this;
        var errorHandler = (function() { player.queryGeofilter(); });
        for (var j = 0; j < numSources; j++) {
            var sourceElement = this.videoElement.querySelectorAll('source')[j];

            if (j == numSources - 1) {
                sourceElement.onerror = errorHandler;
            }
        }

        this.options.element.innerHTML = '';
        
        var wrap = DomHelper.newElement('div', {'class':'image-wrap ratio-16-9 video-wrap'});
        wrap.appendChild(this.videoElement);
        this.options.element.appendChild(wrap);

        this.initializeEvents();
        this.buildAccessabilityControls();
        this.addErrorHandling();

        if (this.options.appData.autoPlay) {
            this.videoElement.setAttribute('autoplay', 'autoplay');
            setTimeout(this.play.bind(this), 100); //ES5 bind is ok here, since IE8 will never initialize Html5Player
        }
    };

    Html5Player.prototype.handleGeoResponse = function(isInDenmark) {
        /**
         *  handleGeoResponse() is called after an error has ocurred. So no matter what we need to show an error.
         *  If the user is outside of Denmark we'll show a geo block error
         */
        if (isInDenmark === true) {
            this.displayError('defaultMsg');
        } else {
            this.displayError('access_denied');
        }
    };

    Html5Player.prototype.addErrorHandling = function () {
        this.videoElement.addEventListener('error', (function(e) {
            if (!e.target.error) {
                this.displayError('defaultMsg');
                return;
            }
            switch(e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    this.displayError('defaultMsg', 'MEDIA_ERR_ABORTED: The fetching process for the media resource was aborted by the user agent at the users request');
                    break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    this.displayError('defaultMsg', 'MEDIA_ERR_NETWORK: A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable');
                    break;
                case e.target.error.MEDIA_ERR_DECODE:
                    this.displayError('defaultMsg', 'MEDIA_ERR_DECODE: An error of some description occurred while decoding the media resource, after the resource was established to be usable');
                    break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    this.displayError('defaultMsg', 'MEDIA_ERR_SRC_NOT_SUPPORTED: The video could not be loaded the format is not supported');
                    break;
                default:
                    this.displayError('defaultMsg');
                    break;
            }
        }).bind(this));
    };
    Html5Player.prototype._seek = function (value) {
        var seconds;
        if (typeof(value) === 'string') {
            seconds = this.timeCodeConverter.timeCodeToSeconds(value);
        } else {
            seconds = value * this.duration();
        }
        if (this.videoElement) {
            try {
                this.videoElement.currentTime = seconds;
                this.play();
            } catch (exception) {
                // suppress this exception - forceseeking will handle it
            }
        }
        return false;
    };
    Html5Player.prototype.onPause = function (event) {
        if (!this.ignoreNextPauseEvent) {
            VideoPlayer.prototype.onPause.call(this, event);

        }
        this.ignoreNextPauseEvent = false;
    };

    Html5Player.prototype.onTimeUpdate = function () {
        if (this.seekWhenReady) {
            try {
                if (this.videoElement.seekable.end() > this.seekWhenReady) {
                    this.videoElement.currentTime = this.seekWhenReady;
                    this.seekWhenReady = null;
                }
            } catch (error) { console.error(error); }
        }
    };

    Html5Player.prototype.getStream = function (quality) {
        if (this.options.videoData.videoType === 'live') {
            return this.findClosestQuality(this.getChannel(), quality);
        } else if (this.options.videoData.videoType === 'ondemand') {
            return this.findClosestQuality(this.links(), quality);
        }
    };
    /**
     * The Html5Player needs more than one stream for live streams (HLS with RTSP failover for Android devices). 
     * Therefore findClosestQuality is overridden to return an Array of streams of diffrent linkTypes at same quality.
     * @param  {Array} streams Streams model
     * @param  {Number} quality desired kbps
     * @return {Array}         Array of objects with a stream and kbps property
     */
    Html5Player.prototype.findClosestQuality = function (streams, quality) {
        if (this.options.videoData.videoType === 'live') {
            var servers = [];

            for (var i = 0; i < streams.servers.length; i++) {
                var s_hls = streams.servers[i];
                if (s_hls.linkType.toLowerCase() === 'hls') {
                    servers.push(s_hls);
                }
            }

            // If no HLS servers were found, move on to check for IOS servers
            if (servers.length === 0) {
                for (var j = 0; j < streams.servers.length; j++) {
                    var s_ios = streams.servers[j];
                    if (s_ios.linkType.toLowerCase() === 'ios') {
                        servers.push(s_ios);
                    }
                }
                
                var rtspServer = null;
                for (var k = 0; k < streams.servers.length; k++) {
                    var s_rtsp = streams.servers[k];
                    if (s_rtsp.linkType.toLowerCase() === 'android') {
                        rtspServer = s_rtsp;
                        break;
                    }
                }

                if (rtspServer !== null && rtspServer !== undefined) {
                    servers.push(rtspServer);
                }
            }

            var qualities = [];
            for (var m=0; m < servers.length; m++) {
                var liveStream = VideoPlayer.prototype.findClosestQuality.call(this, servers[m].qualities, quality);
                qualities.push({stream: servers[m].server + '/' + liveStream.streams[0], kbps: liveStream.kbps});
            }

            return qualities;
        } else {
            var hls = [],
                ios = [],
                rtsp = [];
            for (var n = 0; n < streams.length; n++) {
                var s = streams[n];
                switch (s.linkType.toLowerCase()) {
                    case 'hls':
                        hls.push(s);
                        break;
                    case 'ios':
                        ios.push(s);
                        break;
                    case 'Android':
                        rtsp.push(s);
                        break;
                }
            }

            streams = [];
            var stream;

            if (hls && hls.length > 0) {
                stream = VideoPlayer.prototype.findClosestQuality.call(this, hls, quality, 'Ios');
                streams.push({stream: stream.uri, kbps: stream.bitrateKbps});
            } else {
                // only add these if there were no hls streams
                if (ios && ios.length > 0) {
                    stream = VideoPlayer.prototype.findClosestQuality.call(this, ios, quality, 'Ios');
                    streams.push({stream: stream.uri, kbps: stream.bitrateKbps});
                }
                if (rtsp && rtsp.length > 0) {
                    stream = VideoPlayer.prototype.findClosestQuality.call(this, rtsp, quality, 'Android');
                    streams.push({stream: stream.uri, kbps: stream.bitrateKbps});
                }
            }

            return streams;
        }
    };
    /**
     * Gets the bitrate of the current stream
     * @return {Number} kbps
     */
    Html5Player.prototype.getCurrntBitrate = function () {
        var result = [];
        for (var i = 0; i < this.videoElement.children.length; i++) {
            if (this.videoElement.children[i].getAttribute('src') === this.videoElement.currentSrc) {
                result.push(this.videoElement.children[i]);
            }
        }
        if (result.length > 0) {
            var current = result[0];
            if (current) {
                return current.getAttribute('data-kbps') || 0;
            }
        } else {
            return 0;
        }

    };
    Html5Player.prototype.play = function () {
        this.videoElement.play();
    };
    Html5Player.prototype.pause = function () {
        this.videoElement.pause();
    };
    Html5Player.prototype.stop = function () {
        this.videoElement.stop();
    };
    Html5Player.prototype.progress = function () {
        return this.position() / this.duration(); // current position in timeline in percent (Number between 0 and 1).
    };
    Html5Player.prototype.position = function () {
        if (this.videoElement !== undefined && this.videoElement) {
            return this.videoElement.currentTime; // current position in timeline in seconds
        }

        return 0;
    };
    Html5Player.prototype.duration = function () {
         if (VideoPlayer.prototype.duration.call(this) !== 0) {
            return VideoPlayer.prototype.duration.call(this);
        } else if (this.videoElement) {
            return this.videoElement.duration;
        }
        return 0;
    };

    return Html5Player;
});
