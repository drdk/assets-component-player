/* jshint -W110 */
/* global define: true, _gaq: true */

define("dr-media-html5-video-player", ["dr-media-video-player"], function (VideoPlayer) {
    "use strict";


    function Html5Player (options) {
        VideoPlayer.call(this);

        this.setOptions({
            appData: {
                defaultQuality: 250,
                linkType: "Ios",
                fileType: "mp4"
            }
        });

        if (this.options) {
            this.setOptions(options);
        }

        this.buildPreview();
    }
    
    Html5Player.prototype.updateOptions = function (options) {
        this.options.appData.autoPlay = true;
        this.parent(options);
        this.build();
    };

    Html5Player.prototypebuildPreview = function () {
        //override AbstractPlayer.buildPreview:
        this.updateElementHeight();
        this.build();
    };
    
    Html5Player.prototypebuild = function () {
        if (this.options.videoData.videoType === "ondemand") {
            this.ensureResource(this.postBuild.bind(this));
        } else {
            this.ensureLiveStreams(this.postBuild.bind(this));
        }
        this.parent();
    };

    Html5Player.prototypeinitializeEvents = function () {
        this.videoElement.addEventListener("play", this.onPlay.bind(this), false);
        this.videoElement.addEventListener("pause", this.onPause.bind(this), false);
        this.videoElement.addEventListener("seeking", this.onBeforeSeek.bind(this), false);
        this.videoElement.addEventListener("seeked", this.onAfterSeek.bind(this), false);
        this.videoElement.addEventListener("ended", this.onComplete.bind(this), false);
        //this.videoElement.addEventListener("loadedmetadata", this.onMetaData.bind(this), false);
        this.videoElement.addEventListener("timeupdate", this.onTimeUpdate.bind(this), false);
        this.videoElement.addEventListener("loadedmetadata", this.onDurationChange.bind(this), false);
        this.videoElement.addEventListener("loadedmetadata", this.onMetaDataLoaded.bind(this), false);
    };

    Html5Player.prototype.onMetaDataLoaded = function () {
        //Fire click event
        if (typeof _gaq !== "undefined") {
            _gaq.push(["_trackEvent", "global-assets-video-player", "click", "play"]);
        }
    };

    Html5Player.prototype.postBuild = function () {
        var src = this.getStream(this.options.appData.defaultQuality),poster;
        if (src === null || src.length === 0) {
            // MU will return a program card with no resource links if the user is not in DK
            if (this.links().length === 0) {
                this.displayError("access_denied");
            } else {
                this.displayError("defaultMsg");
            }

            return;
        }
       
        if (this.options.videoData.image) {
            poster = this.options.videoData.image;
        } else {
            poster = this.getPosterImage();
        }
        this.videoElement = new Element("video", {
            "controls": "controls",
            "poster": poster,
            "preload": "none"
        });

        this.videoElement.adopt(src.map(function (s){
            return new Element("source", {
                "src":s.stream,
                "data-kbps":s.kbps
            });
        }));

        //add error handling to last source element
        var numSources = this.videoElement.getElements("source").length;
        for (var i = 0; i < numSources; i++) {
            var sourceElement = this.videoElement.getElements("source")[i];

            if (i == numSources - 1) {
                sourceElement.onerror = (function(event) {
                    //this.displayError("defaultMsg");
                    this.queryGeofilter();
                }).bind(this);
            }
        }

        this.options.element.getChildren().destroy();
        // this.videoElement.inject(this.options.element);
        this.options.element.adopt(
            new Element("div", {"class":"image-wrap ratio-16-9 video-wrap"}).adopt(
                this.videoElement
            )
        );
        this.initializeEvents();
        this.buildAccessabilityControls();
        this.addErrorHandling();

        if (this.options.appData.autoPlay) {
            this.videoElement.set("autoplay", "autoplay");
            this.play.delay(300, this);
        }
    };

    Html5Player.prototype.handleGeoResponse = function(isInDenmark) {
        /**
         *  handleGeoResponse() is called after an error has ocurred. So no matter what we need to show an error.
         *  If the user is outside of Denmark we'll show a geo block error
         */
        if (isInDenmark == "true") {
            this.displayError("defaultMsg");
        } else {
            this.displayError("access_denied");
        }
    };

    Html5Player.prototype.addErrorHandling = function () {
        this.videoElement.addEventListener("error", (function(e) {
            switch(e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    this.displayError("defaultMsg", "MEDIA_ERR_ABORTED: The fetching process for the media resource was aborted by the user agent at the users request");
                    break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    this.displayError("defaultMsg", "MEDIA_ERR_NETWORK: A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable");
                    break;
                case e.target.error.MEDIA_ERR_DECODE:
                    this.displayError("defaultMsg", "MEDIA_ERR_DECODE: An error of some description occurred while decoding the media resource, after the resource was established to be usable");
                    break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    this.displayError("defaultMsg", "MEDIA_ERR_SRC_NOT_SUPPORTED: The video could not be loaded the format is not supported");
                    break;
                default:
                    this.displayError("defaultMsg");
                    break;
            }
        }).bind(this));
    };
    Html5Player.prototype._seek = function (value) {
        var seconds;
        if (typeof(value) === "string") {
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
            this.parent(event);
        }
        this.ignoreNextPauseEvent = false;
    };
    Html5Player.prototype.onPlay = function () {

        this.parent();
    };

    Html5Player.prototype.onTimeUpdate = function (event) {
        if (this.seekWhenReady) {
            try {
                if (this.videoElement.seekable.end() > this.seekWhenReady) {
                    this.videoElement.currentTime = this.seekWhenReady;
                    this.seekWhenReady = null;
                }
            } catch (error) { }
        }
    };

    Html5Player.prototype.getStream = function (quality) {
        var server, channel;
        var linkType = this.options.appData.linkType;
            if (this.options.videoData.videoType === "live") {
                return this.findClosestQuality(this.getChannel(), quality);
            } else if (this.options.videoData.videoType === "ondemand") {
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
        if (this.options.videoData.videoType === "live") {
            var servers = [];

            servers = streams.servers.filter(function (s) {
                return s.linkType.toLowerCase() === "hls";
            });

            // If no HLS servers were found, move on to check for IOS servers
            if (servers.length === 0) {
                servers = streams.servers.filter(function (s) {
                    return s.linkType.toLowerCase() === "ios";
                });
                
                var rtspServer = streams.servers.filter(function (s) {
                    return s.linkType.toLowerCase() === "android";
                })[0];

                if (rtspServer !== null && rtspServer !== undefined) {
                    servers.push(rtspServer);
                }
            }

            var qualities = [];
            for (var i=0; i < servers.length; i++) {
                var stream = this.parent(servers[i].qualities, quality);
                qualities.push({stream: servers[i].server + "/" + stream.streams[0], kbps: stream.kbps});
            }

            return qualities;
        } else {
            var hls = streams.filter(function (item){
                return (item.linkType.toLowerCase() === "hls");
            });
            var ios = streams.filter(function (item){
                return (item.linkType === "Ios");
            });
            var rtsp = streams.filter(function (item){
                return (item.linkType === "Android");
            });

            var streams = [];
            var stream;

            if (hls && hls.length > 0) {
                stream = this.parent(hls, quality, "Ios");
                streams.push({stream: stream.uri, kbps: stream.bitrateKbps});
            } else {
                // only add these if there were no hls streams
                if (ios && ios.length > 0) {
                    stream = this.parent(ios, quality, "Ios");
                    streams.push({stream: stream.uri, kbps: stream.bitrateKbps});
                }
                if (rtsp && rtsp.length > 0) {
                    stream = this.parent(rtsp, quality, "Android");
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
        var result = this.videoElement.getChildren().filter(function (source){
            return (source.get("src") === this.videoElement.currentSrc);
        }.bind(this));
        if (result.length > 0) {
            var current = result[0];
            if (current) {
                return current.get("data-kbps") || 0;
            }
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
         if (this.parent() !== 0) {
            return this.parent();
        } else if (this.videoElement) {
            return this.videoElement.duration;
        }
        return 0;
    };

    return Html5Player;
});
