/* jshint -W110 */
/* global define: true */

define("dr-media-flash-video-player", ["dr-media-class", "dr-media-video-player", "dr-media-flash-object"], function (MediaClass, VideoPlayer, FlashObject) {
    "use strict";

    function FlashPlayer (options) {
        VideoPlayer.call(this, options);

        this.setOptions({
            'appData': {
                'errorMessages': {
                    'obsolete_flash_player': 'Du skal have <a href="http://get.adobe.com/flashplayer/">Adobe Flash Player 10 eller nyere</a> installeret for at se denne video.'

                },
                bufferSettings: {
                    dynamicStreamBufferTime: 3,
                    staticStreamBufferTime: 3
                }
            }
        });

        if (options) {
            this.setOptions(options);
        }

        this.buildPreview();

        console.log("FlashPlayer constructor");
    }

    MediaClass.inheritance(FlashPlayer, VideoPlayer);

    FlashPlayer.prototype.getQuerystring = function (key, default_) {
        if (default_===null) default_="";

        key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
        var qs = regex.exec(window.location.href);

        if(qs === null)
            return default_;
        else
            return qs[1];

    };
    FlashPlayer.prototype.build = function () {
        console.log("FlashPlayer.build");
        if (Browser.Plugins.Flash.version < 10) {
            // if this is a live stream we need to load the live data first, to be able to give the user an HLS stream
            if (this.options.videoData.videoType === "live") {
                this.ensureLiveStreams(this.showFlashErrorMessage, this);
            } else {
                this.showFlashErrorMessage();
            }
            
            return;
        }
        if (this.options.videoData.videoType === 'ondemand') {
            this.ensureResource(this.postBuild, this);
        } else if (this.options.videoData.videoType === 'live') {
            this.ensureLiveStreams(this.postBuild, this);
        }
        VideoPlayer.prototype.build.call(this);
    };
    FlashPlayer.prototype.showFlashErrorMessage = function () {
        this.displayError('obsolete_flash_player');
        var links = this.links();
        var HLSpath = "";
        var errorContainer = this.options.element.getElement('.wrapper');

        if (this.options.videoData.videoType === "live") {
            if (!this.getChannel())
                return;

            this.getChannel().servers.each(function(link) {
                if(link.linkType.toLowerCase() == "hls" && link.qualities.length > 0 && link.qualities[0].streams.length > 0) {
                    HLSpath = link.server + '/' + link.qualities[0].streams[0];
                }
            });
        } else {
            links.each(function(link) {
                if(link.linkType.toLowerCase() == "hls") {
                    HLSpath = link.uri;
                }
            });
        }

        if (!HLSpath)
            return;

        var HlsPathMessage = new Element('a', {
            html : 'Direkte sti til stream',
            href : HLSpath

        }).inject(errorContainer);
    };
    FlashPlayer.prototype.postBuild = function () {
        console.log("FlashPlayer.postBuild");
        this.containerHtmlCache = this.options.element.get('html');

        var splittedHref = window.location.href.split('#!/');
        if (splittedHref.length > 1 && splittedHref[1].length > 1) {
            this.options.videoData.startTimeCode = splittedHref[1];
            this.options.appData.autoPlay = true;
        }

        this.clearContent();
        var flashWrapper = new Element('div', {'class':'image-wrap ratio-16-9 flash-wrap'}).inject(this.options.element);

        // IE8 JS cannot communicate with swiff obj if using cached swf. So with IE8 we always want to avoid used the cached version.
        var queryString = Browser.ie8 ? '?cachekill=' + Date.now() : '?cachekill=20131003';
        var swfUrl = '';
        
        if (this.getQuerystring('testplayer', '') == 'true') {
            swfUrl = '/assets/swf/program-player-test.swf' + queryString;
        } else {
            swfUrl = '/assets/swf/program-player.swf' + queryString;
        }
        
        this.swiff = new FlashObject(swfUrl, {
            container: flashWrapper,
            height: '100%',
            width: '100%',
            version: "11.0.0",
            params: {
                bgcolor: '#000000',
                AllowScriptAccess: 'sameDomain',
                AllowFullScreen: true,
                wMode: 'direct'
            },
            vars: {
                appData: JSON.encode(this.options.appData),
                videoData: JSON.encode(this.options.videoData),
                programcardResult: JSON.encode(this.programcardResult)
            },
            callBacks: {
                as_play: this.onPlay.bind(this),
                as_pause: this.onPause.bind(this),
                as_buffering: this.onBuffering.bind(this),
                as_buffering_complete: this.onBufferingComplete.bind(this),
                as_seekBefore: this.onBeforeSeek.bind(this),
                as_seekComplete: this.onAfterSeek.bind(this),
                as_complete: this.onComplete.bind(this),
                as_display_error: this.displayError.bind(this),
                as_changeChannel: this.changeChannel.bind(this),
                as_durationChange: this.onDurationChange.bind(this),
                as_setFullscreen: (function (value) {
                    this.options.appData.isFullscreen = value;
                }).bind(this),
                as_changeODContent: this.changeContent.bind(this),
                as_popUp: this.handlePopupRequest.bind(this),
                as_queryGeofilter: this.queryGeofilter.bind(this)
            }
        });
        
        try {
            this.swiff.setAttribute('tabindex', '-1');
        } catch (err) {
            if (window.console && console.log) {
                console.log('error setting tabindex for swff.object');
            }
        }

        // DR Login modal events:
        document.body.addEvents({
            'modal_open': this.onHtmlModalOpen.bind(this),
            'modal_close': this.onHtmlModalClose.bind(this)
        });
        // AddThis modal events:
        if (window.addthis) {
            window.addthis.addEventListener('addthis.menu.open', this.onHtmlModalOpen.bind(this));
            window.addthis.addEventListener('addthis.menu.close', this.onHtmlModalClose.bind(this));
        }
        this.options.appData.controlsHeight = 32;
        this.updateElementHeight();
        this.buildAccessabilityControls();
    };
    FlashPlayer.prototype.onHtmlModalOpen = function () {
        clearTimeout(this.showPlayerTimer);
        if (this.swiff !== null) {
            try { //IE8 throws exception
                    this.pause();
            } catch (e) {} 
            this.detach();
        }
    };
    FlashPlayer.prototype.swiffRemote = function () {
        if (this.swiff) {
            return this.swiff.remote.apply(this.swiff, arguments);
        } else {
            console.error('FlashObject not created!');
        }
    };
    FlashPlayer.prototype.onHtmlModalClose = function () {
        this.showPlayerTimer = this.reattach.delay(100, this);
    };
    FlashPlayer.prototype.play = function () {
        return this.swiffRemote('js_play');
    };
    FlashPlayer.prototype.pause = function () {
        return this.swiffRemote('js_pause');
    };
    FlashPlayer.prototype.position = function () {
        return this.swiffRemote('js_position');
    };
    FlashPlayer.prototype._seek = function (value) {
        try {
            if (typeof(value) === 'string') {
                this.swiffRemote('js_seekToTimeCode', value);
            } else {
                this.swiffRemote('js_seek', value);
            }
            return true;
        } catch (e) { }
        return false;
    };
    FlashPlayer.prototype.updateOptions = function (options) {
        VideoPlayer.prototype.updateOptions.call(this, options);
        this.ensureResource(function () {
            if (this.swiff) {
                return this.swiffRemote('js_setOptions', {
                    'videoData': this.options.videoData,
                    'appData': this.options.appData,
                    'programcardResult': this.programcardResult
                });
            }
            this.build();
        }, this);
    };
    FlashPlayer.prototype.reattach = function () {
        if (this.swiff === null) {
            this.build();
        }
        var container = this.options.element;
        if (container.hasClass('detached')) {
            container.removeClass('detached');
        }
        container.removeEvent('click', this.bindedClick);
        this.fireEvent('reattached');
    };
    FlashPlayer.prototype.handlePopupRequest = function () {
        try { //IE8 throws exception
                this.pause();
        } catch (e) {} 

        if (this.options.appData.isPopup === true) {
            window.close();
        } else {
            var url;
            if (this.options.videoData.videoType === "live") {
                url = this.options.appData.urls.popupUrl;
            } else {
                url = this.options.appData.urls.popupUrl + '#!/' + this.currentTimeCode();
            }

            this.popup = window.open(url, 'popupPlayer', 'height=478,width=830,resizable=yes,scrollbars=no');
        }
    };
    FlashPlayer.prototype.detach = function (isPopup) {
        var container, contentContainer;
        container = this.options.element;
        this.clearContent();
        if (isPopup) {
            this.bindedClick = this.detachedContainerClick.bind(this);
            container.addEvent('click', this.bindedClick);
            container.addClass('detached');

            contentContainer = new Element('div', { 'class': 'wrapper' });
            contentContainer.adopt(new Element('h1', {
                text: 'Luk popup!'
            }));

            container.grab(new Element('div', { 'class': 'floater' }));
            container.grab(contentContainer);
        }
        this.swiff = null;
        this.fireEvent('detached');
    };
    FlashPlayer.prototype.detachedContainerClick = function (event) {
        if (this.popup !== null) {
            this.popup.close();
        } else {
            this.reattach();
        }
    };
    FlashPlayer.prototype.buildErrorDetails = function (errorDetails, info, errorCode) {
        if (!errorDetails)
            errorDetails = [];
        
        errorDetails.userAgent = navigator.userAgent;
        errorDetails.info = info;
        errorDetails.errorCode = errorCode;
        errorDetails.url = document.URL;

        var sortable = [];
        for (var p in errorDetails)
            sortable.push([p, errorDetails[p]]);

        sortable.sort().reverse();

        //for (var p in errorDetails) {
        for (var i = 0; i < sortable.length; i++) {
            var key = sortable[i][0];
            var value = sortable[i][1];
            var text = '';

            if (typeof(value) === 'object') {
                text = 'Capabilities:';

                for (var o in value) {
                    text += '\r\n\t' + o + ': ' + value[o];
                }
            } else {
                text = key + ': ' + value;
            }
            
            this.logOutput = text + '\r\n' + this.logOutput;
        }

        var downloadLinkElement = new Element('a', { html:'Hent fejlbeskrivelse' } );
        downloadLinkElement.setProperty('download', this.getLogFileName());
        downloadLinkElement.set('href', this.makeTextFile(this.logOutput));

        return downloadLinkElement;
    };
    FlashPlayer.prototype.makeTextFile = function (text) {
        this.logTextFile = "data:text/plain," + encodeURIComponent(text);

        return this.logTextFile;
    };
    FlashPlayer.prototype.getLogFileName = function () {
        var filename = 'dr-player-';
        var date = new Date();
        var month = date.getMonth() + 1;
        if (month.toString().length == 1) month = '0' + month;
        var day = date.getDate();
        if (day.toString().length == 1) day = '0' + day;

        // Add today's date
        filename += date.getFullYear().toString() + month.toString() + day.toString();


        // Add time of day
        filename += '-' + date.getHours() + '_' + date.getMinutes();

        // Add file extension
        filename += '.txt';

        return filename;
    };
    FlashPlayer.prototype.handleGeoResponse = function (isInDenmark) {
        if (isInDenmark == 'true') {
            this.swiffRemote('js_geofilterResponse', true);
        } else {
            this.displayError('access_denied');
        }
    };


    return FlashPlayer;
});
