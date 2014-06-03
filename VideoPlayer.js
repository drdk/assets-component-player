define("dr-media-video-player", ["dr-media-class", "dr-media-abstract-player", "dr-lazyloader"], function (MediaClass, AbstractPlayer, LazyLoader) {
    "use strict";

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
                fuillscreenChannelChooserEnabled: false,
                popupEnabled: false,
                fullscreenEnabled: true,
                urls: {
                    cmsImagesPath: '/cmsimages/dynimage.drxml?file={0}&w={1}&h={2}&scaleafter=crop',
                    defaultImage: '/assets/img/video-player-default-image.png',
                    liveStreams: '/tv/external/channels?mediaType=tv',
                    channelLogoUrl: '/assets/img/logos/dr-logo-{id}-small.png'
                }
            }
        });

        if (options) {
            this.setOptions(options);
        }

        if (window) {
            var supportsOrientationChange = "onorientationchange" in window,
            orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
            if (options.platform == 'ios' || options.platform == 'android') {
                window.addEventListener(orientationEvent, this.updateElementHeight.bind(this));
            }
        }

        console.log("VideoPlayer constructor");
    }
    MediaClass.inheritance(VideoPlayer, AbstractPlayer);

    VideoPlayer.prototype.updateElementHeight = function () {
        if (this.options.appData.maintainContainerAspect) {
            this.options.element.setStyle('height', (this.options.element.offsetWidth / 16 * 9) + this.options.appData.controlsHeight);
        }
    };
    VideoPlayer.prototype.buildPreview = function () {
        console.log("VideoPlayer.buildPreview");
        var imagePath, build;
        if (this.options.appData.autoPlay) {
            this.build();
            return;
        }
        build = function () {
            if ( (this.options.element.getElement('img') !== null)&&(this.options.element.getElement('img').get('src').length > 0) ) {
                this.originalPosterImage = this.options.element.getElement('img').get('src');
            }
            this.clearContent();
            imagePath = this.getPosterImage();
            var markup = new Element('a', {'href':'#', 'title':'Afspil video', 'class':'image-wrap ratio-16-9', 'aria-role':'button'}).adopt(
                new Element('noscript', {'data-src':imagePath}).adopt(
                    //new Element('img', {'src':imagePath}) //crashes IE8
                ),
                new Element('div', { 'class': 'dummy-controls' }).adopt(
                    new Element('div', { 'class': 'play dr-icon-play' })
                ),
                new Element('div', { 'class': 'icon-wrap' }).adopt(
                    new Element('span', { 'class': 'dr-icon-play-inverted-large' })
                )
            );
            this.options.element.adopt(markup);
            markup.addEvent('click', function (event) {
                event.stop();

                //Fire click event
                if (typeof _gaq !== 'undefined') {
                    _gaq.push(['_trackEvent', 'global-assets-video-player', 'click', 'play']);
                }

                this.options.appData.autoPlay = true;
                this.build();
            } .bind(this));
            this.options.appData.controlsHeight = 32;
            this.updateElementHeight();
            window.fireEvent("dr-dom-inserted", [new Elements([markup]), ["dr-lazyloader"]]);
        }.bind(this);

        switch (this.options.videoData.videoType) {
            case 'live':
                build();
                break;
            case 'ondemand':
                this.ensureResource(build);
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
        var container, play, pause, stop, forward, backwards;
        container = new Element('div', { 'class': 'accessability-controls' });
        container.inject(this.options.element);
        play = new Element('button', { 'text': 'afspil video' }).addEvent('click', this.play.bind(this)).inject(container);
        if (this.options.videoData.videoType === 'ondemand') {
            pause = new Element('button', { 'text': 'pause video' }).addEvent('click', this.pause.bind(this)).inject(container);
            forward = new Element('button', { 'text': 'spol frem i video' }).addEvent('click', function () {
                this.seek(this.progress() + 0.1);
            } .bind(this)).inject(container);
            backwards = new Element('button', { 'text': 'spol tilbage i video' }).addEvent('click', function () {
                this.seek(this.progress() - 0.1);
            } .bind(this)).inject(container);
        } else {
            stop = new Element('button', { 'text': 'stop video' }).addEvent('click', this.pause.bind(this)).inject(container);
        }
    };
    VideoPlayer.prototype.displayError = function (errorCode, info, logOutput, errorDetails) {
        this.logOutput = logOutput;
        //if (window.console && console.log) console.log('logOutput: ' + logOutput);
        var container, paragraph, floater, log;

        container = this.options.element;
        container.addClass('error');

        this.clearContent();

        var headerText = this.options.appData.errorMessages['header'];

        if (errorCode === 'access_denied') {
            errorCode = this.options.videoData.videoType === 'live' ? 'access_denied_live' : 'access_denied_od';

            headerText = this.options.appData.errorMessages['header_' + errorCode];
        }

        var header = new Element('h3', {
            text: headerText
        });

        var paragraphText = this.options.appData.errorMessages[errorCode];
        if (paragraphText === null || paragraphText.length === 0) {
            paragraphText = this.options.appData.errorMessages.defaultMsg;
        }
        paragraph = new Element('p', {
            html: paragraphText
        });

        var errorContainer = this.buildErrorContainer(info, errorCode, errorDetails, header, paragraph);

        floater = new Element('div', {});
        floater.addClass('floater');
        container.grab(floater);
        container.grab(errorContainer);
        this.logError(errorCode);
        this.fireEvent('displayError');
    };
    VideoPlayer.prototype.buildErrorContainer = function (info, errorCode, errorDetails, header, paragraph) {
        var errorGfx = new Element('div', {});
        errorGfx.addClass('gfx').addClass('dr-icon-alert');

        var errorContainer = new Element('div', {});
        errorContainer.addClass('wrapper');
        errorContainer.adopt(errorGfx, header, paragraph);

        if (!this.isValidErrorDownloadBrowser())
            return errorContainer;

        if(errorCode != "obsolete_flash_player") { // Don't show error log if error is caused by obsolete flash version / no flash
            var detailsElement = this.buildErrorDetails(errorDetails, info, errorCode)
            if (detailsElement && detailsElement !== null) {
                errorContainer.adopt(detailsElement);
            }
        }

        return errorContainer;
    };
    VideoPlayer.prototype.isValidErrorDownloadBrowser = function () {
        if(navigator.appName.indexOf("Internet Explorer")!=-1){     //yeah, he's using IE
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
