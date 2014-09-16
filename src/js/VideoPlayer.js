/* jshint devel: true */
/* global define: true, _gaq: true */

/**
 * TODO: Build accessability controls
 **/
define('dr-media-video-player', ['dr-media-class', 'dr-media-abstract-player', 'video-control-accessability-controls', 'dr-widget-media-dom-helper', 'dr-media-hash-implementation', 'dr-error-messages'], function (MediaClass, AbstractPlayer, AccessabilityControls, DomHelper, HashTimeCodeImplementation, DrErrorMessages) {
    'use strict';

    function VideoPlayer (options) {

        AbstractPlayer.call(this, options);

        this.logOutput = '';
        this.firstPlay = true;

        this.setOptions({
            mediaType: 'video',
            appData: {
                isFullscreen: false,
                maintainContainerAspect: true,
                popupEnabled: false,
                fullscreenEnabled: true,
                urls: {
                    cmsImagesPath: '/cmsimages/dynimage.drxml?file={0}&w={1}&h={2}&scaleafter=crop',
                    defaultImage: '/assets/img/video-player-default-image.png',
                    liveStreams: '/mu-online/api/1.0/channel/all-active-dr-tv-channels',
                    channelLogoUrl: '/assets/img/logos/dr-logo-{id}-small.png'
                }
            }
        });

        if (options) {
            this.setOptions(options);
        }

        if (this.options.enableHashTimeCode) {
            this.hashTimeCodeInstance = new HashTimeCodeImplementation(this);
        }

        // if (window) {
        //     var supportsOrientationChange = 'onorientationchange' in window,
        //     orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize';
        //     if (options.platform == 'ios' || options.platform == 'android') {
        //         window.addEventListener(orientationEvent, this.updateElementHeight.bind(this));
        //     }
        // }

    }

    MediaClass.inheritance(VideoPlayer, AbstractPlayer);

    VideoPlayer.prototype.updateElementHeight = function () {
        console.error('updateElementHeight is depricated');
    };

    VideoPlayer.prototype.buildPreview = function () {
        var imagePath, build;
        
        if (this.options.appData.autoPlay) {
            this.build();
            return;
        }

        build = function () {

            this.clearContent();
            imagePath = this.getPosterImage();
            
            var markup = DomHelper.newElement('a', {'href':'#', 'title':'Afspil video', 'class':'image-wrap', 'aria-role':'button'} );
            markup.innerHTML = ''+
                '<img src="'+imagePath+'" />' +
                '<div class="dummy-controls"><div class="play dr-icon-play"></div></div>' +
                '<div class="icon-wrap"><div class="dr-icon-play-inverted-large"></div></div>' +
                '';
            this.options.element.appendChild(markup);

            var player = this;
            DomHelper.on(markup, 'click', function (event) {
                DomHelper.cancelEvent(event);
                
                player.options.appData.autoPlay = true;
                player.build();
            });
        };

        switch (this.options.videoData.videoType) {
            case 'live':
                build.apply(this);
                break;
            case 'ondemand':  
                this.ensureResource(build, this);
                break;
        }
    };
    VideoPlayer.prototype.onPlay = function() {
        AbstractPlayer.prototype.onPlay.call(this);

        if (!this.firstPlay) {
            return;
        }

        this.firstPlay = false;

        if (typeof _gaq !== 'undefined') {
            _gaq.push(['_trackEvent', 'tv-site-video-player', 'click', 'play']);
        }
    };
    VideoPlayer.prototype.build = function () { };
    VideoPlayer.prototype.getChannel = function () {
        return this.options.videoData.channels.filter(function (c) {
            return c.slug === this.options.videoData.channelId;
        }, this)[0];
    };
    VideoPlayer.prototype.buildAccessabilityControls = function () {
        this.accessabilityControls = new AccessabilityControls(this);
    };
    VideoPlayer.prototype.displayError = function (errorCode, info, logOutput, errorDetails) {
        this.logOutput = logOutput;
        var container, paragraph, floater;

        container = this.options.element;
        DomHelper.addClass(container, 'error');

        this.clearContent();

        var headerText = DrErrorMessages.getMediaErrorHeader();

        if (errorCode === 'access_denied') {
            errorCode = this.options.videoData.videoType === 'live' ? 'access_denied_live' : 'access_denied_od';

            headerText = DrErrorMessages.getMediaErrorHeader(errorCode);
        }

        var header = DomHelper.newElement('h3', {
            text: headerText
        });

        var paragraphText = DrErrorMessages.getMediaErrorMessage('video', errorCode);
        if (paragraphText === null || paragraphText.length === 0) {
            paragraphText = DrErrorMessages.getMediaErrorMessage('video');
        }
        paragraph = DomHelper.newElement('p');
        paragraph.innerHTML = paragraphText;

        var errorContainer = this.buildErrorContainer(info, errorCode, errorDetails, header, paragraph);

        floater = DomHelper.newElement('div', {});
        DomHelper.addClass(floater, 'floater');
        container.appendChild(floater);
        container.appendChild(errorContainer);
        this.logError(errorCode);
        this.fireEvent('displayError');
    };
    VideoPlayer.prototype.buildErrorContainer = function (info, errorCode, errorDetails, header, paragraph) {
        var errorGfx = DomHelper.newElement('div', {});
        DomHelper.addClass(errorGfx, 'gfx');
        DomHelper.addClass(errorGfx, 'dr-icon-alert');

        var errorContainer = DomHelper.newElement('div', {});
        DomHelper.addClass(errorContainer, 'wrapper');
        errorContainer.appendChild(errorGfx);
        errorContainer.appendChild(header);
        errorContainer.appendChild(paragraph);

        if (!this.isValidErrorDownloadBrowser())
            return errorContainer;

        if(errorCode != 'obsolete_flash_player') { // Don't show error log if error is caused by obsolete flash version / no flash
            var detailsElement = this.buildErrorDetails(errorDetails, info, errorCode);
            if (detailsElement && detailsElement !== null) {
                errorContainer.appendChild(detailsElement);
            }
        }

        return errorContainer;
    };
    VideoPlayer.prototype.isValidErrorDownloadBrowser = function () {
        if(navigator.appName.indexOf('Internet Explorer')!=-1){     //yeah, he's using IE
            return false;
        } else if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
            return true;
        } else if (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
            return true;
        } else {
            return false;
        }
    };
    VideoPlayer.prototype.buildErrorDetails = function (/*errorDetails, info, errorCode*/) { };


    return VideoPlayer;

});
