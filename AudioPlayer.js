/* jshint devel: true */
/* global define: true, require: true */

define('dr-media-audio-player',
['dr-media-class', 'dr-media-abstract-player', 'dr-lazyloader',
    'audio-control-error-message', 'audio-control-settings-button', 'audio-control-play-button-overlay', 'audio-control-play-button',
    'audio-control-progressbar', 'audio-control-volumeselector', 'audio-control-skip-buttons', 'dr-media-hash-implementation'],
function (MediaClass, AbstractPlayer, LazyLoader, ErrorMessageControl, SettingsButton, PlayButtonOverlayControl, PlayButtonControl, ProgressBarControl, VolumeSelectorControl, SkipButtonsControl, HashTimeCodeImplementation) {
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
        
        AbstractPlayer.call(this);

        this.setOptions({
            mediaType: 'audio',
            videoData: {},
            appData: {
                defaultQuality: -1,
                gemius: {
                    identifier: 'ApianyLnm8kTV5nad0MB0cTYzQCZuM9wIVf5SZ5x.rH.n7<'
                },
                errorMessages: {
                    access_denied: 'Denne lydfil er af ophavsretsmæssige årsager beskyttet mod visning udenfor Danmark. Hvis du befinder dig i Danmark og mener du har fået denne besked ved en fejl, kontakt os da på brugerhenvendelsessiden',
                    not_found: 'Programmet du søger findes desværre ikke.',
                    connection_failed: 'Der er desværre sket en fejl. Læs om driftstatus og kontakt til DR på brugerhenvendelsessiden',
                    timeout: 'Afspilleren har været inaktiv for længe. Genindlæs siden, så kan du se videoen igen.',
                    defaultMsg: 'Der er desværre sket en fejl. Vi kigger på sagen, så prøv igen senere!'
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
            this.options.element.addClass('touch'); //TODO: addClass
        }
        var data = this.load();
        if (data && data.bitrate) {
            // cookie was already set
            this.options.appData.defaultQuality = data.bitrate;
        }

        // bind methods
        ['play', 'pause', 'stop', 'progress', 'position', 'duration'].forEach(function (fn) { //TODO: forEach
            this[fn] = this[fn].bind(this); //TODO: bind
        }, this);

        this.addEvent('resourceReady', this.setDurationClass.bind(this)); //TODO: bind

        this.build();

        console.log('AudioPlayer constructor ' + options);
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
            this.options.element.addClass('hours'); //TODO: addClass
        } else {
            this.options.element.removeClass('hours'); //TODO: removeClass
        }
    };

    AudioPlayer.prototype.build = function () {
        console.log('AudioPlayer.build');
        var container = this.options.element;
        if (this.options.videoData.videoType === 'ondemand') {
            container.adopt(
                new PlayButtonControl(this),
                //new PlayButtonOverlayControl(this),
                new ProgressBarControl(this),
                new SettingsButton(this)
            );

            if (document.getElement('#net-radio')) { //TODO: getElement
                new PlayButtonOverlayControl(this);
            }
        } else {
            container.adopt( //TODO: adopt
                new PlayButtonControl(this, null,'dr-icon-stop-large'),
                //new PlayButtonOverlayControl(this),
                new ProgressBarControl(this),
                new SettingsButton(this)
            );

            if (document.getElement('#net-radio')) {
                new PlayButtonOverlayControl(this);
            }
        }

        if (this.options.appData.volumeControls) {
            this.options.element.addClass('has-volume'); //TODO: addClass
            container.adopt(new VolumeSelectorControl(this)); //TODO: adopt
        }

        this.options.element.addClass('loading');

        if(this.options.videoData.videoType === 'live') {
            this.initializeLiveProgressbar();
        }

        window.fireEvent('dr-widget-audio-player-initialized', container); //TODO: window.fireEvent
    };


    AudioPlayer.prototype.saveBitrate = function (bitrate) {
        var expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);

        this.options.appData.defaultQuality = bitrate;
        var data = { bitrate: bitrate };

        document.cookie = 'audio-player-bitrate=' + encodeURIComponent(JSON.stringify(data)) + ';expires=' + expires.toUTCString() + ';path=/;domain=.dr.dk';
    };
    AudioPlayer.prototype.ready = function () {
        console.log('AudioPlayer.ready');
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

            console.log('AudioPlayer.getStream ' + item.uri);
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

        console.log("Link converted to internal resource path: " + link);

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
        require(['dr-widget-live-element'], function (LiveElement) {
            this.liveProgressBar = new LiveElement(this.options.element);
            window.liveprogress = this.liveProgressBar.domElement;
            this.liveProgressBar.domElement.addEvent('update', this.update.bind(this));
        }.bind(this));
    };
    AudioPlayer.prototype.buildPreview = function () {
        // no-op, audioplayer has no preview
    };
    AudioPlayer.prototype.displayError = function (errorCode, errorDescription) {
        var msg = this.options.appData.errorMessages[errorCode];
        this.options.element.adopt(new ErrorMessageControl(msg, errorDescription));
        /*jshint devel:true*/
        if (window.console && console.log) { console.log(errorDescription); }
    };
    AudioPlayer.prototype.registerSkipProvider = function (provider) {
        this.skipProvider = provider;
        if(this.options.videoData.videoType !== 'live') {
            var buttons = new SkipButtonsControl(this);
            var container = this.options.element;
            $(buttons).inject(container.getElement('.progressbar'), 'before');
        }
    };
    AudioPlayer.prototype.onBeforeSeek = function () {
        AbstractPlayer.prototype.onBeforeSeek.call(this);
    };
    AudioPlayer.prototype.onBuffering = function (pos) {
        this.options.element.addClass('buffering');
        AbstractPlayer.prototype.onBuffering.call(this, pos);
    };
    AudioPlayer.prototype.onBufferingComplete = function (pos) {
        this.options.element.removeClass('buffering');
        AbstractPlayer.prototype.onBufferingComplete.call(this, pos);
    };
    AudioPlayer.prototype.setLiveTimestamps = function (start, end) {
        this.options.element.getElement('.text span:first-child').set('text', start);
        this.options.element.getElement('.text span:last-child').set('text', end);
    };
    AudioPlayer.prototype.update = function () {
        window.fireEvent('dr-widget-audio-player-program-end', this);
    };

    return AudioPlayer;

});
