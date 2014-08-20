/* jshint devel: true */
/* global define: true */

define('dr-media-player-factory', [
    'dr-widget-media-dom-helper',
    'dr-media-flash-object',
    'dr-media-abstract-player',
    'dr-media-flash-video-player',
    'dr-media-html5-video-player',
    'dr-media-flash-audio-player',
    'dr-media-html5-audio-player',
    'dr-media-gemius-implementation',
    'dr-media-psdb-utilities',
    'dr-media-sola-implementation',
    'dr-media-springstreams-implementation'
    
], function ( DomHelper, FlashObject, AbstractPlayer, FlashPlayer, Html5Player, FlashAudioPlayer, Html5AudioPlayer, GemiusImplementation, PsdbUtilities, SolaImplementation, SpringstreamsImplementation ) {
    'use strict';

    /*jshint browser:true, mootools:true*/

    function hasFlash() {
        return FlashObject.getFlashMajorVersion() > 9;
    }

    function hasRequiredFlashForVideo() {
        return FlashObject.getFlashMajorVersion() > 10 || (FlashObject.getFlashMajorVersion() === 10 && FlashObject.getFlashMinorVersion() >= 2);
    }

    function canPlayHLS() {
        if (DomHelper.Browser.safari || DomHelper.Browser.Platform.ios || DomHelper.Browser.Platform.android) {
            return true;
        } else {
            return false;
        }
    }

    function canPlayMp3() {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    }

    function canControlVolume() {
        if (DomHelper.Browser.Platform.android) { return false; }
        var a = document.createElement('audio');
        a.volume = 0.9;
        return (a.volume !== 1);
    }

    function buildHtml5VideoPlayer(options) {
        var getQuerystring = AbstractPlayer.prototype.getQuerystring;

        options.platform = 'all';
        options.appData.linkType = 'ios';

         if (getQuerystring('forceios') == 'true') {
                options.appData.linkType = 'Ios';  
                DomHelper.Browser.Platform.name = 'Ios'; 
                options.platform = 'ios';
            }
            if (getQuerystring('forceandroid') == 'true') {
                options.appData.linkType = 'Android';
                DomHelper.Browser.Platform.name = 'Android';   
                options.platform = 'android';
            }

        if (window.navigator.userAgent.match(/iPad/i)) {
            options.appData.defaultQuality = 1000;
        }

        var player = new Html5Player(options);
        var sola = new SolaImplementation(player);
        var springStreams = new SpringstreamsImplementation(player);

        return player;
    }

    var PlayerFactory = {
        getPlayer: function (options) {
            var getQuerystring = AbstractPlayer.prototype.getQuerystring;
            var player, gemius, psdbUtilities, sola, springStreams;

            if (options.type && options.type === 'audio') {

                options.appData.volumeControls = canControlVolume();

                if (DomHelper.Browser.Platform.android) {
                    options.appData.linkType = "Android";
                    options.platform = DomHelper.Browser.Platform.name;
                } if (DomHelper.Browser.Platform.ios || getQuerystring('forceios') == 'true') {
                    //enable HLS streams for iPhone/iPad
                    options.appData.linkType = 'Ios';
                    options.platform = DomHelper.Browser.Platform.name;
                }

                if ((DomHelper.Browser.Platform.android && canPlayMp3()) || getQuerystring('forceios') == 'true') {
                    player = new Html5AudioPlayer(options);
                    sola = new SolaImplementation(player);
                } else if (hasFlash()) {
                    player = new FlashAudioPlayer(options);
                } else if (canPlayMp3()) {
                    player = new Html5AudioPlayer(options);
                    sola = new SolaImplementation(player);
                } else if (!hasFlash()) {
                    // initialize flash player. Will result in a "flash required" error message
                    console.log('flash not installed');
                    player = new FlashAudioPlayer(options);
                } else {
                    console.log('fallback to html5 player. hasFlash(): ' + hasFlash());
                    // initialize html5 player. Will result in an error message since audio playback is probably not supported.
                    player = new Html5AudioPlayer(options);
                }

                psdbUtilities = new PsdbUtilities(player);
            } else {

                if (DomHelper.Browser.Platform.ios || DomHelper.Browser.Platform.android || (getQuerystring('forceandroid') == 'true') || (getQuerystring('forceios') == 'true') ) {
                    player = buildHtml5VideoPlayer(options);
                } else {
                    if (hasRequiredFlashForVideo()) {
                        player = new FlashPlayer(options);
                    } else if (canPlayHLS()) {
                        player = buildHtml5VideoPlayer(options);
                    } else {
                        // We build this, only to have it display the "obsolete flash version" error message
                        player = new FlashPlayer(options);
                    }
                }
            }
            
            if (document.URL.indexOf('http://localhost') > -1 || getQuerystring('testgemius', '') == 'true') {
                player.setOptions({
                    appData:{
                        gemius: {
                            identifier: 'nG3qv4yhf5tCBFBDdg9Yd.WoDtwFYkNTUkvP5wgzgP7.Q7',
                            hitcollector: 'http://pro.hit.gemius.pl'
                        }
                    }
                });
            }
            gemius = new GemiusImplementation(player);

            return player;
        }
    };
    return PlayerFactory;
});

/* Legacy support */
define('dr-widget-video-player-factory', ['dr-media-player-factory'], function(PlayerFactory) {
    'use strict';
    return PlayerFactory;
});
