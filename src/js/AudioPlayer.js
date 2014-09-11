/* jshint devel: true */
/* global define: true, require: true */

define('dr-media-audio-player',
['dr-media-class', 'dr-media-abstract-player', 'dr-widget-media-dom-helper',
    'audio-control-error-message', 'audio-control-settings-button', 'audio-control-play-button-overlay', 'audio-control-play-button',
    'audio-control-progressbar', 'audio-control-volumeselector', 'audio-control-skip-buttons', 'dr-media-hash-implementation', 'dr-error-messages'],
function (MediaClass, AbstractPlayer, DomHelper, ErrorMessageControl, SettingsButton, PlayButtonOverlayControl, PlayButtonControl, ProgressBarControl, VolumeSelectorControl, SkipButtonsControl, HashTimeCodeImplementation, DrErrorMessages) {
    'use strict';

    /*
    if (!window.console) { window.console = {}; }
    if (console.log) { console._log = console.log; }
    console.log = function (msg) {
        var el = document.getElement('#HEST_log');
        if (!el) {
            el = new Element('pre', { id: 'HEST_log', styles: { backgroundColor: '#ccf', fontSize: '12px' }});
            el.inject(document.getElement('.dr-ui-paging-tabs'), 'top');
        }
        el.set('text', el.get('text') + '\n' + msg);
        if (console._log) {
            console._log.apply(console, arguments);
        }
    };
    */
    function AudioPlayer (options) {
        
        AbstractPlayer.call(this, options);

        this.setOptions({
            mediaType: 'audio',
            videoData: {},
            appData: {
                defaultQuality: -1,
                gemius: {
                    identifier: 'ApianyLnm8kTV5nad0MB0cTYzQCZuM9wIVf5SZ5x.rH.n7<'
                },
                urls: {
                    liveStreams: '/mu-online/api/1.0/channel/all-active-dr-radio-channels',
                    channelLogoUrl: '/assets/img/logos/dr-logo-{id}-small.png'
                }
            }
        });

        if (options) {
            this.setOptions(options);
        }

        this.bitratesAvailable = [];
        this.targetTimeCode = null;

        if (options) {
            this.setOptions(options);
        }
        
        if (this.options.enableHashTimeCode) {
            this.hashTimeCodeInstance = new HashTimeCodeImplementation(this);
        }

        this.isTouch = ('ontouchmove' in window);
        if (this.isTouch) {
            DomHelper.addClass(this.options.element, 'touch');
        }
        var data = this.load();
        if (data && data.bitrate) {
            // cookie was already set
            this.options.appData.defaultQuality = data.bitrate;
        }

        this.addEvent('resourceReady', this.setDurationClass, this);

        this.build();
    }
    MediaClass.inheritance(AudioPlayer, AbstractPlayer);

    AudioPlayer.prototype.load = function () {
        var data = document.cookie.match(/(?:^|[; ]+)audio-player-bitrate=([^;]+)(?:;|$)/);
        if (data) {
            data = JSON.parse(decodeURIComponent(data[1]));
            return data;
        }
        else {
            return null;
        }
    };

    AudioPlayer.prototype.setDurationClass = function () {
        if (this.duration() >= 3600) {
            DomHelper.addClass(this.options.element, 'hours');
        } else {
            DomHelper.removeClass(this.options.element, 'hours');
        }
    };

    AudioPlayer.prototype.build = function () {
        var container = this.options.element;
        if (this.options.videoData.videoType === 'ondemand') {
            container.appendChild(new PlayButtonControl(this));
            container.appendChild(new ProgressBarControl(this));
            container.appendChild(new SettingsButton(this));

            if (document.getElementById('net-radio')) {
                new PlayButtonOverlayControl(this);
            }
        } else {
            container.appendChild(new PlayButtonControl(this, null,'dr-icon-stop-large'));
            container.appendChild(new ProgressBarControl(this));
            container.appendChild(new SettingsButton(this));

            if (document.getElementById('net-radio')) {
                new PlayButtonOverlayControl(this);
            }
        }

        if (this.options.appData.volumeControls) {
            DomHelper.addClass(this.options.element, 'has-volume');
            container.appendChild(new VolumeSelectorControl(this));
        }

        DomHelper.addClass(this.options.element, 'loading');

        if(this.options.videoData.videoType === 'live') {
            this.initializeLiveProgressbar();
        }

        // legacy support: live radio expects a mootools dom 
        // event when the player is initialized
        if ('fireEvent' in window) {
            window.fireEvent('dr-widget-audio-player-initialized', container);
        }
    };


    AudioPlayer.prototype.saveBitrate = function (bitrate) {
        var expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);

        this.options.appData.defaultQuality = bitrate;
        var data = { bitrate: bitrate };

        document.cookie = 'audio-player-bitrate=' + encodeURIComponent(JSON.stringify(data)) + ';expires=' + expires.toUTCString() + ';path=/;domain=.dr.dk';
    };
    AudioPlayer.prototype.ready = function () {
        this.options.element.removeClass('loading');
        if (this.options.appData.autoPlay) {
            this.play();
        }
    };
    AudioPlayer.prototype.getChannel = function () {
        var channels = this.options.videoData.channels;

        for (var i=0; i < channels.length; i++) {
            if (channels[i].slug === this.options.videoData.channelId) {
                return channels[i];
            }
        }

        return null;
    };
    AudioPlayer.prototype.setBitratesAvailable = function (value) {
        this.bitratesAvailable = value;
        this.fireEvent('dr-widget-audio-player-bitrates-available');
    };
    AudioPlayer.prototype.setNewBitrate = function (bitrate) {
        if (bitrate === this.options.appData.defaultQuality) {
            return;
        }
        this.saveBitrate(bitrate);
        this.fireEvent('dr-widget-audio-player-bitrate-selected');
        if (this.options.videoData.videoType === 'ondemand') {
            this.targetTimeCode = this.currentTimeCode();
        }
    };
    AudioPlayer.prototype.getStream = function (quality) {
        var item;
        if (this.options.videoData.videoType === 'live') {
            item = this.findClosestQuality(this.getChannel().servers, quality);
            this.setBitratesAvailable(this.getBitratesFromLiveStream(item));
            var selectedStream = this.getStreamByBitrate(quality);
            if (selectedStream) {
                return selectedStream.uri;
            } else {
                return item.server + '/' + item.qualities[0].streams[0];
            }
        } else if (this.options.videoData.videoType === 'ondemand') {
            item = this.findClosestQuality(this.links(), quality);
            if (item.linkType.toLowerCase() === 'hds') {
                this.setBitratesAvailable(this.getBitratesFromODStream(item));

                item = this.getStreamByBitrate(quality);
            }

            if (this.options.appData.useInternalResources === true) {
                item.uri = this.convertToInternalResource(item.uri);
            }
            return item.uri;
        }
    };
    AudioPlayer.prototype.convertToInternalResource = function(link) {
        var replaceable = [
            "/all/clear/streaming/",
            "/all/clear/download/",
            "/all/token/streaming/",
            "/all/token/download/",
            "/dk/clear/streaming/",
            "/dk/clear/download/",
            "/dk/token/streaming/",
            "/dk/token/download/"
        ];
        
        for (var i=0, tot=replaceable.length; i < tot; i++) {
            var item = replaceable[i];

            link = link.replace(item, "/dr/clear/download/");
        }

        link = link.replace("/z/all/clear/streaming/", "/z/dr/clear/download/");

        return link;
    };
    AudioPlayer.prototype.getBitratesFromODStream = function (stream) {
            // create bitrates array with default 'all bitrates' option
            var bitrates = [{
                bitrate: -1, 
                uri: stream.uri
            }];
            var parts = stream.uri.split(',');
            var first = parts.splice(0, 1);
            var last = parts.pop();
            var bitrateObj;
            // Sort bitrates to ascending order
            parts.sort(function(a,b){return a-b; });
            for(var i = 0; i < parts.length; i++) {
                bitrateObj = {
                    bitrate: parts[i], 
                    uri: first + ',' + parts[i] + ',' + last
                };

                bitrates.push(bitrateObj);
            }
            return bitrates;
    };
    AudioPlayer.prototype.getBitratesFromLiveStream = function (stream) {
        if (stream.linkType.toLowerCase() !== 'hds' && stream.linkType.toLowerCase() !== 'hls') {
            return;
        }
        var bitrateObj;
        var quality;
        var bitrates = [];
        for(var i = 0; i < stream.qualities.length; i++) {
            quality = stream.qualities[i];

            // Do not add quality if there is no stream for the quality
            if (quality.streams.length === 0)
                continue;

            bitrateObj = {
                bitrate: quality.kbps, 
                uri: stream.server + '/' + quality.streams[0]
            };

            bitrates.push(bitrateObj);
        }
        return bitrates;
    };
    AudioPlayer.prototype.getStreamByBitrate = function (bitrate) {
        if (!this.bitratesAvailable || this.bitratesAvailable.length === 0) {
            console.log('Error: No bitrates available');
            return null;
        }
        var i, closest = null;
        for(i = 0; i < this.bitratesAvailable.length; i++) {
            if (closest === null || Math.abs(this.bitratesAvailable[i].bitrate - bitrate) < Math.abs(closest.bitrate - bitrate)) {
                closest = this.bitratesAvailable[i];
            }
        }
        return closest;
    };
    AudioPlayer.prototype.setLoadingState = function () {
        this.options.element.addClass('loading');
    };
    AudioPlayer.prototype.updateOptions = function (options) {
        AbstractPlayer.prototype.updateOptions.call(this, options);
        this.parent(options);
        this.clearContent();
        this.build();
    };
    AudioPlayer.prototype.initializeLiveProgressbar = function () {
        var startTimeStamp = parseInt(this.options.element.getAttribute('data-start'));
        var endTimeStamp = parseInt(this.options.element.getAttribute('data-end'));
        var nowTimeStamp = parseInt(this.options.element.getAttribute('data-now'));
        var initialized = new Date().getTime();

        // hijack position, duration and onProgressChange
        this.position = function () {
            var timeElapsed = (new Date().getTime() - initialized);
            return (nowTimeStamp - startTimeStamp) + timeElapsed;
        };
        this.duration = function () {
            return endTimeStamp - startTimeStamp;
        };
        this.onProgressChange = function () {
            if (this.progress() >= 1) {
                // legacy support: live radio expects a mootools dom 
                // event when progress timestamps needs to be updated
                if ('fireEvent' in window) {
                    window.fireEvent('dr-widget-audio-player-program-end', this);
                    // this.options.element.fireEvent('update', this.options.element);
                }
            }
            AudioPlayer.prototype.onProgressChange.call(this);
        };
        // match old interface to the progressbar:
        this.liveProgressBar = this.liveProgressBar || {};
        this.liveProgressBar.initialize = function (element) {
            startTimeStamp = parseInt(element.getAttribute('data-start'));
            endTimeStamp = parseInt(element.getAttribute('data-end'));
            nowTimeStamp = parseInt(element.getAttribute('data-now'));
            initialized = new Date().getTime();
        }
    };
    AudioPlayer.prototype.buildPreview = function () {
        // no-op, audioplayer has no preview
    };
    AudioPlayer.prototype.displayError = function (errorCode, errorDescription) {
        AbstractPlayer.prototype.displayError.call(this, arguments);

        var msg = DrErrorMessages.getMediaErrorMessage('audio', errorCode);
        this.options.element.adopt(new ErrorMessageControl(msg, errorDescription));
        
        /*jshint devel:true*/
        if (window.console && console.log) { console.log(errorDescription); }
    };
    AudioPlayer.prototype.registerSkipProvider = function (provider) {
        this.skipProvider = provider;
        if(this.options.videoData.videoType !== 'live') {
            var buttons = new SkipButtonsControl(this);
            var container = this.options.element;
            var progressbar = container.querySelector('.progressbar') || null;
            console.log('AudioPlayer.registerSkipProvider');
            container.insertBefore(buttons, progressbar);
        }
    };
    AudioPlayer.prototype.onBeforeSeek = function () {
        AbstractPlayer.prototype.onBeforeSeek.call(this);
    };
    AudioPlayer.prototype.onBuffering = function (pos) {
        DomHelper.addClass(this.options.element, 'buffering');
        AbstractPlayer.prototype.onBuffering.call(this, pos);
    };
    AudioPlayer.prototype.onBufferingComplete = function (pos) {
        DomHelper.removeClass(this.options.element, 'buffering');
        AbstractPlayer.prototype.onBufferingComplete.call(this, pos);
    };
    AudioPlayer.prototype.setLiveTimestamps = function (start, end) {
        this.options.element.getElement('.text span:first-child').set('text', start);
        this.options.element.getElement('.text span:last-child').set('text', end);
    };

    return AudioPlayer;

});
