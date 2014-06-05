/* jshint devel: true */
/* global define: true */

/**
 * TODO: dont use DR namespace for swf path
 **/
define('dr-media-flash-video-player', ['dr-media-class', 'dr-media-video-player', 'dr-media-flash-object', 'dr-widget-media-dom-helper'], function (MediaClass, VideoPlayer, FlashObject, DomHelper) {
    'use strict';

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
                },
                enableHashTimeCode: false
            }
        });

        if (options) {
            this.setOptions(options);
        }
        this.buildPreview();

        if (this.options.appData.isPopup) {
            this.initializePopup();
        }
    }

    MediaClass.inheritance(FlashPlayer, VideoPlayer);

    FlashPlayer.prototype.build = function () {
        console.log('FlashPlayer.build');

        if (FlashPlayer.isFlashOutdated()) {
            // if this is a live stream we need to load the live data first, to be able to give the user an HLS stream
            if (this.options.videoData.videoType === 'live') {
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
    FlashPlayer.isFlashOutdated =  function() {
        return FlashObject.getFlashMajorVersion() < 10 || (FlashObject.getFlashMajorVersion() == 10 && FlashObject.getFlashMinorVersion() < 2);
    };
    FlashPlayer.prototype.showFlashErrorMessage = function () {
        this.displayError('obsolete_flash_player');
        var links = this.links();
        var HLSpath = '';
        var link;
        var errorContainer = this.options.element.querySelector('.wrapper');

        if (this.options.videoData.videoType === 'live') {
            if (!this.getChannel())
                return;
            for (link in this.getChannel().servers) {
                if(link.linkType.toLowerCase() == 'hls' && link.qualities.length > 0 && link.qualities[0].streams.length > 0) {
                    HLSpath = link.server + '/' + link.qualities[0].streams[0];
                }
            }
        } else {
            for (link in links) {
                if(link.linkType.toLowerCase() == 'hls') {
                    HLSpath = link.uri;
                }                
            }
        }

        if (!HLSpath)
            return;

        var streamLink = DomHelper.newElement('a', {
            text : 'Direkte sti til stream',
            href : HLSpath
        });
        errorContainer.appendChild(streamLink);

    };
    FlashPlayer.prototype.postBuild = function () {
        this.containerHtmlCache = this.options.element.innerHTML;

        var splittedHref = window.location.href.split('#!/');
        if (splittedHref.length > 1 && splittedHref[1].length > 1) {
            this.options.videoData.startTimeCode = splittedHref[1];
            this.options.appData.autoPlay = true;
        }

        this.clearContent();
        var flashWrapper = DomHelper.newElement('div', {'class':'image-wrap ratio-16-9 flash-wrap'});
        this.options.element.appendChild(flashWrapper);

        // IE8 JS cannot communicate with swiff obj if using cached swf. So with IE8 we always want to avoid used the cached version.
        var queryString = DomHelper.Browser.ie8 ? '?cachekill=' + Date.now() : '?cachekill=20131003';
        var swfUrl = '';
        
        if (this.getQuerystring('testplayer', '') == 'true') {
            swfUrl = '/assets/swf/program-player-test.swf' + queryString;
        } else {
            swfUrl = '/assets/swf/program-player.swf' + queryString;
        }
        
        var self = this;
        this.swiff = new FlashObject(swfUrl, {
            container: flashWrapper,
            height: '100%',
            width: '100%',
            version: '11.0.0',
            params: {
                bgcolor: '#000000',
                AllowScriptAccess: 'sameDomain',
                AllowFullScreen: true,
                wMode: 'direct'
            },
            vars: {
                appData: JSON.stringify(this.options.appData),
                videoData: JSON.stringify(this.options.videoData),
                programcardResult: JSON.stringify(this.programcardResult)
            },
            callBacks: {
                as_play: function(){ self.onPlay.apply(self, arguments); }, //this.onPlay,
                as_pause: function(){ self.onPause.apply(self, arguments); },
                as_buffering: function(){ self.onBuffering.apply(self, arguments); },
                as_buffering_complete: function(){ self.onBufferingComplete.apply(self, arguments); },
                as_seekBefore: function(){ self.onBeforeSeek.apply(self, arguments); },
                as_seekComplete: function(){ self.onAfterSeek.apply(self, arguments); },
                as_complete: function(){ self.onComplete.apply(self, arguments); },
                as_display_error: function(){ self.displayError.apply(self, arguments); },
                as_changeChannel: function(){ self.changeChannel.apply(self, arguments); },
                as_durationChange: function(){ self.onDurationChange.apply(self, arguments); },
                as_setFullscreen: function (value) {
                    self.options.appData.isFullscreen = value;
                },
                as_changeODContent: function(){ self.changeContent.apply(self, arguments); },
                as_popUp: function(){ self.handlePopupRequest.apply(self, arguments); },
                as_queryGeofilter: function(){ self.queryGeofilter.apply(self, arguments); }
            }
        });
        
        try {
            this.swiff.setAttribute('tabindex', '-1');
        } catch (err) {
            if (window.console && console.log) {
                console.log('error setting tabindex for swff.object');
            }
        }

        function onHtmlModalOpen () {
            clearTimeout(self.showPlayerTimer);
            if (self.swiff !== null) {
                try { //IE8 throws exception
                        self.pause();
                } catch (e) {} 
                self.detach();
            }
        }
        function onHtmlModalClose () {
            self.showPlayerTimer = self.reattach.delay(100, self);
        }

        DomHelper.on(document.body, 'modal_open', onHtmlModalOpen);
        DomHelper.on(document.body, 'modal_close', onHtmlModalClose);

        // AddThis modal events:
        if (window.addthis) {
            window.addthis.addEventListener('addthis.menu.open', onHtmlModalOpen);
            window.addthis.addEventListener('addthis.menu.close', onHtmlModalClose);
        }
        this.options.appData.controlsHeight = 32;
        this.updateElementHeight();
        this.buildAccessabilityControls();
    };
    FlashPlayer.prototype.swiffRemote = function () {
        if (this.swiff) {
            return this.swiff.remote.apply(this.swiff, arguments);
        } else {
            console.error('FlashObject not created!', arguments);
        }
    };
    FlashPlayer.prototype.play = function () {
        return this.swiffRemote('js_play');
    };
    FlashPlayer.prototype.pause = function () {
        return this.swiffRemote('js_pause');
    };
    FlashPlayer.prototype.position = function () {
        try {
            return this.swiffRemote('js_position');
        } catch (e) { return 0; }
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
        if (DomHelper.hasClass(container, 'detached')) {
            DomHelper.removeClass(container, 'detached');
        }
        if (this.bindedDetachedClickHandler) {
            DomHelper.off(container, 'click', this.bindedDetachedClickHandler);
        }
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
            if (this.options.videoData.videoType === 'live') {
                url = this.options.appData.urls.popupUrl;
            } else {
                url = this.options.appData.urls.popupUrl + '#!/' + this.currentTimeCode();
            }

            this.popup = window.open(url, 'popupPlayer', 'height=478,width=830,resizable=yes,scrollbars=no');
        }
    };
    FlashPlayer.prototype.detachedClickHandler = function () {
        if (this.popup) {
            this.popup.close();
        }
        this.reattach();
    };
    FlashPlayer.prototype.detach = function (isPopup) {
        var container, contentContainer;
        container = this.options.element;
        this.clearContent();
        if (isPopup) {
            this.bindedDetachedClickHandler = (function(_this){
                return function () { _this.detachedClickHandler.call(_this); };
            })(this);
            DomHelper.on(container, 'click', this.bindedDetachedClickHandler);
            DomHelper.addClass(container, 'detached');

            contentContainer = DomHelper.newElement('div', { 'class': 'wrapper' });
            contentContainer.appendChild(DomHelper.newElement('h1', {
                text: 'Luk popup!'
            }));

            container.appendChild(DomHelper.newElement('div', { 'class': 'floater' }));
            container.appendChild(contentContainer);
        }
        this.swiff = null;
        this.fireEvent('detached');
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

        var downloadLinkElement = DomHelper.newElement('a', { text:'Hent fejlbeskrivelse' } );
        downloadLinkElement.setAttribute('download', this.getLogFileName());
        downloadLinkElement.setAttribute('href', this.makeTextFile(this.logOutput));

        return downloadLinkElement;
    };
    FlashPlayer.prototype.makeTextFile = function (text) {
        this.logTextFile = 'data:text/plain,' + encodeURIComponent(text);
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

    FlashPlayer.prototype.initializePopup = function () {
        if (window.opener !== null && window.opener.DR.TV.playerInstance !== null) {
            window.opener.DR.TV.playerInstance.popupLoaded.call(window.opener.DR.TV.playerInstance);
            DomHelper.on(window, 'unload', function () {
                window.opener.DR.TV.playerInstance.popupUnloaded.call(window.opener.DR.TV.playerInstance, window.DR.TV.playerInstance.currentTimeCode());
            });
        }
    };
    FlashPlayer.prototype.popupLoaded = function () {
        this.detach(true);
    };
    FlashPlayer.prototype.popupUnloaded = function (timecode) {
        if(timecode){
            var url=window.location.href.split('#!/')[0];
            url=url+'#!/'+timecode;
            window.location.replace(url);
        }
        this.reattach();
    };


    return FlashPlayer;
});
