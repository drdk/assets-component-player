/* jshint devel: true */
/* global define: true, _gaq: true */

/**
 * TODO: Build accessability controls
 **/
define('dr-media-video-player', ['dr-media-class', 'dr-media-abstract-player', 'dr-widget-media-dom-helper', 'dr-media-hash-implementation'], function (MediaClass, AbstractPlayer, DomHelper, HashTimeCodeImplementation) {
    'use strict';

    function VideoPlayer (options) {

        AbstractPlayer.call(this, options);

        this.logOutput = '';

        this.setOptions({
            mediaType: 'video',
            appData: {
                errorMessages: {
                    header: 'Fejlmeddelelse',
                    header_access_denied_od: 'DR TV On Demand',
                    header_access_denied_live: 'DR TV LIVE-udsendelse',
                    access_denied_od: 'Af rettighedsmæssige årsager kan vi ikke afspille denne udsendelse. Sidder du ved en computer med en udenlandsk ip-adresse, kan det være grunden til at du ikke kan se programmet.',
                    access_denied_live: 'Af rettighedsmæssige årsager kan vi ikke afspille denne live kanal i øjeblikket. Det skyldes enten at<ul><li>- Man kan ikke se DR’s livekanaler fra udlandet, da DR sender mange programmer, der af rettighedsmæssige grunde ikke må vises uden for Danmark. Sidder du ved en computer med en udenlandsk ip-adresse, kan det være grunden til at du ikke kan se programmet.</li></ul>eller<ul><li>- Ved nogle udsendelser har DR ikke rettigheder til at vise indholdet på dr.dk på grund af ældre rettighedsaftaler, der ikke inkluderer tilladelse til streaming.</li></ul>',
                    not_found: 'Programmet du søger findes desværre ikke.',
                    connection_failed: 'Der er desværre sket en fejl. Læs om driftstatus og kontakt til DR på <a href="/tv/feedback">brugerhenvendelsessiden</a>.',
                    timeout: 'DR beklager at udsendelsen ikke afspilles. Vi undersøger sagen, og anbefaler at der forsøges igen senere.',
                    plugin_not_found: 'En nødvendig komponent kunne ikke hentes.<br/>Læs om driftstatus og kontakt til DR på <a href="/tv/feedback">brugerhenvendelsessiden</a>.',
                    defaultMsg: 'Der er desværre sket en fejl. Vi kigger på sagen, så prøv igen senere.'
                },
                controlsHeight: 0,
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

        if (window) {
            var supportsOrientationChange = 'onorientationchange' in window,
            orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize';
            if (options.platform == 'ios' || options.platform == 'android') {
                window.addEventListener(orientationEvent, this.updateElementHeight.bind(this));
            }
        }

    }

    MediaClass.inheritance(VideoPlayer, AbstractPlayer);

    VideoPlayer.prototype.updateElementHeight = function () {
        if (this.options.appData.maintainContainerAspect) {
            this.options.element.style.height = (this.options.element.offsetWidth / 16 * 9) + this.options.appData.controlsHeight;
        }
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
                if (typeof _gaq !== 'undefined') {
                    _gaq.push(['_trackEvent', 'global-assets-video-player', 'click', 'play']);
                }
                player.options.appData.autoPlay = true;
                player.build();
            });

            this.options.appData.controlsHeight = 32;
            this.updateElementHeight();
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
    VideoPlayer.prototype.build = function () { };
    VideoPlayer.prototype.getChannel = function () {
        return this.options.videoData.channels.filter(function (c) {
            return c.slug === this.options.videoData.channelId;
        }, this)[0];
    };
    VideoPlayer.prototype.buildAccessabilityControls = function () {
        // TODO:
        // var container, play, pause, stop, forward, backwards;
        // container = new Element('div', { 'class': 'accessability-controls' });
        // container.inject(this.options.element);
        // play = new Element('button', { 'text': 'afspil video' }).addEvent('click', this.play.bind(this)).inject(container);
        // if (this.options.videoData.videoType === 'ondemand') {
        //     pause = new Element('button', { 'text': 'pause video' }).addEvent('click', this.pause.bind(this)).inject(container);
        //     forward = new Element('button', { 'text': 'spol frem i video' }).addEvent('click', function () {
        //         this.seek(this.progress() + 0.1);
        //     } .bind(this)).inject(container);
        //     backwards = new Element('button', { 'text': 'spol tilbage i video' }).addEvent('click', function () {
        //         this.seek(this.progress() - 0.1);
        //     } .bind(this)).inject(container);
        // } else {
        //     stop = new Element('button', { 'text': 'stop video' }).addEvent('click', this.pause.bind(this)).inject(container);
        // }
    };
    VideoPlayer.prototype.displayError = function (errorCode, info, logOutput, errorDetails) {
        
        this.logOutput = logOutput;
        var container, paragraph, floater;

        container = this.options.element;
        DomHelper.addClass(container, 'error');

        this.clearContent();

        var headerText = this.options.appData.errorMessages.header;

        if (errorCode === 'access_denied') {
            errorCode = this.options.videoData.videoType === 'live' ? 'access_denied_live' : 'access_denied_od';

            headerText = this.options.appData.errorMessages['header_' + errorCode];
        }

        var header = DomHelper.newElement('h3', {
            text: headerText
        });

        var paragraphText = this.options.appData.errorMessages[errorCode];
        if (paragraphText === null || paragraphText.length === 0) {
            paragraphText = this.options.appData.errorMessages.defaultMsg;
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
    VideoPlayer.prototype.buildErrorDetails = function (errorDetails, info, errorCode) { };


    return VideoPlayer;

});
