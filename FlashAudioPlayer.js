/*jshint mootools:true,browser:true,devel:true */
define("dr-media-flash-audio-player", ["dr-media-class", "dr-media-audio-player"], function (MediaClass, AudioPlayer) {
    "use strict";

    function FlashAudioPlayer (options) {
        
        AudioPlayer.call(this, options);
        this.setOptions({
            'appData': {
                'errorMessages': {
                    'obsolete_flash_player': 'Du skal have <a href="http://get.adobe.com/flashplayer/">Adobe Flash Player 10 eller nyere</a> installeret for at høre dette.'
                }
            }
        });
        if (options) {
            this.setOptions(options);
        }

        this.flashStreamInitalized = false;
        

        //register global eventCatcher for flash callbacks:
        if (!window.DR) {
            window.DR = {};
        }
        if (!window.DR.NetRadio) {
            window.DR.NetRadio = {};
        }
        this.eventCatcherId = "eventCatcher_" + this.mediaPlayerId.toString();
        window.DR.NetRadio[this.eventCatcherId] = this.eventCatcher.bind(this); //TODO: bind

        console.log("FlashAudioPlayer constructor");
    }

    MediaClass.inheritance(FlashAudioPlayer, AudioPlayer);

    FlashAudioPlayer.prototype.build = function () {
        console.log('FlashAudioPlayer.build');
        if (Browser.Plugins.Flash.version < 10) {
            this.displayError('obsolete_flash_player');
            return;
        }

        this._ensureStream = this.options.videoData.videoType === 'ondemand' ?  this.ensureResource : this.ensureLiveStreams;
        this._ensureStream(this.postBuild, this);
        AudioPlayer.prototype.build.call(this)
    };
    FlashAudioPlayer.prototype.getQuerystring = function (key, default_) {
        if (default_==null) default_="";

        key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
        var qs = regex.exec(window.location.href);

        if(qs == null)
            return default_;
        else
            return qs[1];
    };
    FlashAudioPlayer.prototype.postBuild = function () {
            var swiffContainer = new Element('div', { 'class':'DRInvisibleAudioPlayer',
                styles: { position: 'absolute' }
            });

            this.options.element.adopt(swiffContainer);

            var swfUrl = '/assets/swf/DRInvisibleAudioPlayer.swf';
            
            this.swiff = new Swiff(swfUrl, { //TODO: Swiff
                container: swiffContainer,
                params: {
                    allowscriptaccess: 'sameDomain',
                    wmode: 'transparent',
                    bgcolor: '#ffffff'
                },
                vars: {
                    eventCatcherFunction: "window.DR.NetRadio." + this.eventCatcherId,
                    autoPlay: this.options.appData.autoPlay
                }
            });
            // this.swiff.object.set('tabindex', '-1');
    };
    FlashAudioPlayer.prototype.eventCatcher = function (event) {
        console.log('FlashAudioPlayer.eventCatcher:' + event.type + ' ' + event.playState);
        switch (event.type) {

            case "versionEvent":
                //flash player is ready
                this.setVolume(this.currentVolume || 0.7);
                this.setBroadcastData();
                this.ready();
                break;

            case "progressEvent":
                this.lastProgressEvent = event;
                this.onProgressChange();
                break;

            case "complete":
                this.onComplete();
                break;

            case "playStateChange":
                if (event.playState === "playing") {
                    this.isPlaying = true;
                    this.onPlay();
                } else if (event.playState === "paused") {
                    this.isPlaying = false;
                    this.onPause();
                } else if (event.playState === "stopped") {
                    this.flashStreamInitalized = false;
                    this.isPlaying = false;
                    this.onStop();
                }
                break;

            case "bufferProgressEvent":
                // console.log("buffer: " + event.progress);
                break;

            case "bufferingChange":
                if (event.buffering) {
                    this.options.element.addClass('buffering');
                    this.onBuffering(this.position());
                } else {
                    this.options.element.removeClass('buffering');
                    this.onBufferingComplete(this.position());
                }
                break;

            case "seekingChange":
                if (event.seeking) {
                    this.onBeforeSeek(this.lastProgressEvent.currentTime);
                } else {
                    this.lastProgressEvent = { 'currentTime': event.time};
                    this.onAfterSeek(event.time);
                    this.onProgressChange();
                    this.onPlay();
                }
                break;

            case "mediaError":
                if (event.error && event.error.detail)
                    console.log(event.error.detail);

                this.displayError('defaultMsg');
                break;

            default:
                 if (window.console && console.log) { console.log("unknown event: ", event.type); }
                break;
        }
    };
    FlashAudioPlayer.prototype.setBroadcastData = function () {
        if (this.options.videoData.videoType === 'live') {
            try {
                Swiff.remote(this.swiff.object, 'flash_setVideoData', this.options.videoData);
            } catch (err) {
                console.log("Error calling 'flash_setVideoData'");
            }
        } else if (this.programcardResult !== null) {
            var pc = this.programcardResult;
            pc.videoType = this.options.videoData.videoType;
            try {
                Swiff.remote(this.swiff.object, 'flash_setProgramCard', this.programcardResult);
            } catch (err) {
                console.log("Error calling 'flash_setProgramCard'");
            }
        }
    };
    FlashAudioPlayer.prototype.setNewBitrate = function (bitrate) {
        console.log('FlashAudioPlayer.setNewBitrate ' + bitrate);
        AudioPlayer.prototype.setNewBitrate.call(this, bitrate);
        this.flashStreamInitalized = false;
        this.play();
        if (this.targetTimeCode) this.seek(this.targetTimeCode);
    };
    FlashAudioPlayer.prototype.updateOptions = function (options) {
        //this.pause(); // stop current stream
        this.setOptions(options); // set new options
        this.setOptions({ 'appData': { 'autoPlay': true} }); // enable autoplay
        this.forgetModel(); // reset resource
        this.flashStreamInitalized = false; // tell flash to load new file
        this.play();
    };
    FlashAudioPlayer.prototype.play = function () {
        console.log('FlashAudioPlayer.play flashStreamInitalized: ' + this.flashStreamInitalized);

        if (!this.flashStreamInitalized) {
            this._ensureStream(function () {
                console.log('FlashAudioPlayer.play getting stream');
                var stream = this.getStream(this.options.appData.defaultQuality);
                console.log('FlashAudioPlayer.play ' + stream);

                if (!stream) {
                    console.log('invalid stream: ' + stream + ' ::: ABORTING!');
                }
                
                Swiff.remote(this.swiff.object, 'flash_play', stream);
                this.flashStreamInitalized = true;
            }, this);
        } else {
            if (!this.isPlaying) {
                Swiff.remote(this.swiff.object, 'flash_pause'); //toggle pause
            }
        }
    };
    FlashAudioPlayer.prototype.pause = function () {
        Swiff.remote(this.swiff.object, 'flash_pause');
    };
    FlashAudioPlayer.prototype.stop = function () {
        Swiff.remote(this.swiff.object, 'flash_stop');
    };
    FlashAudioPlayer.prototype.position = function () {
        if (this.lastProgressEvent) {
            return this.lastProgressEvent.currentTime;
        } else {
            return 0;
        }
    };
    FlashAudioPlayer.prototype.volume = function () {
        return this.currentVolume;
    };
    FlashAudioPlayer.prototype.setVolume = function (vol) {
        this.currentVolume = vol;
        if (this.swiff) Swiff.remote(this.swiff.object, 'flash_setVolume', vol);
        this.fireEvent('volumechange');
    };
    FlashAudioPlayer.prototype._seek = function (value) {
        var seconds;
        if (typeof(value) === 'string') {
            seconds = this.timeCodeConverter.timeCodeToSeconds(value);
        } else {
            seconds = value * this.duration();
        }
        if (this.isPlaying) {
            try {
                Swiff.remote(this.swiff.object, 'flash_seekTo', seconds);
                return true;
            } catch (error) {
                return false;
            }
        }
        return false;
    };

    return FlashAudioPlayer;
});
