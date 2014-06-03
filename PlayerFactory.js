define("dr-media-player-factory", [
    "dr-media-flash-video-player",
    "dr-media-html5-video-player",
    "dr-media-flash-audio-player",
    "dr-media-html5-audio-player",
    "dr-media-gemius-implementation",
    "dr-media-gemius-implementation-test",
    "dr-media-psdb-utilities",
    "dr-media-conviva-implementation",
    "dr-media-sola-implementation",
    "dr-media-springstreams-implementation",
    'swfobject'
], function (FlashPlayer, Html5Player, FlashAudioPlayer, Html5AudioPlayer, GemiusImplementation, GemiusImplementationTest, PsdbUtilities, ConvivaImplementation, SolaImplementation, SpringstreamsImplementation) {
    "use strict";

    /*jshint browser:true, mootools:true*/

    function hasFlash() {
        /*global deconcept */ // provided by SWFObject
        return deconcept.SWFObjectUtil.getPlayerVersion().major;
    }

    function canPlayMp3() {
        var a = document.createElement('audio');
        return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    }

    function canControlVolume() {
        if (Browser.Platform.name === 'android') { return false; }
        var a = document.createElement('audio');
        a.volume = 0.9;
        return (a.volume !== 1);
    }

    function getQuerystring(key, default_) {
        if (default_==null) default_="";

        key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
        var qs = regex.exec(window.location.href);

        if(qs == null)
            return default_;
        else
            return qs[1];
    }

    var PlayerFactory = {
        getPlayer: function (options) {

            var player, gemius, psdbUtilities, conviva,sola, springStreams;

            if (options.type && options.type === 'audio') {

                options.appData.volumeControls = canControlVolume();
                
                // if (Browser.Platform.android) {
                //     //enable RTSP stream for Android devices
                //     options.appData.linkType = "Android";
                //     options.platform = Browser.Platform.name;
                // } else
                if (Browser.Platform.ios || getQuerystring('forceios') == 'true') {
                    //enable HLS streams for iPhone/iPad
                    options.appData.linkType = "Ios";
                    options.platform = Browser.Platform.name;
                }

                if ((Browser.Platform.android && canPlayMp3()) || getQuerystring('forceios') == 'true') {
                    player = new Html5AudioPlayer(options);
                    sola = new SolaImplementation(player);
                } else if (hasFlash()) {
                    player = new FlashAudioPlayer(options);
                } else if (canPlayMp3()) {
                    player = new Html5AudioPlayer(options);
                    sola = new SolaImplementation(player);
                } else {
                    // TODO: ???
                }
                psdbUtilities = new PsdbUtilities(player);
            } else {
                if (Browser.Platform.ios || Browser.Platform.android || (getQuerystring('forceandroid') == 'true') || (getQuerystring('forceios') == 'true') ) {
                    options.platform = 'all';
                    options.appData.linkType = Browser.Platform.name;

                     if (getQuerystring('forceios') == 'true')
                        {
                        options.appData.linkType = 'Ios';  
                        Browser.Platform.name = 'Ios'; 
                         options.platform = 'ios';
                        }

                        if (getQuerystring('forceandroid') == 'true')
                        {
                        options.appData.linkType = 'Android';
                        Browser.Platform.name = 'Android';   
                         options.platform = 'android';
                        }


                    if (window.navigator.userAgent.match(/iPad/i)) {
                        options.appData.defaultQuality = 1000;
                    }
                    player = new Html5Player(options);
                    conviva = new ConvivaImplementation(player);
                    sola = new SolaImplementation(player);
                    springStreams = new SpringstreamsImplementation(player);
                } else {
                    player = new FlashPlayer(options);
                }
            }


            //if (getQuerystring('testgemius', '') === 'true') {
            if (document.URL.indexOf('http://localhost') > -1 || getQuerystring('testgemius', '') == 'true') {
                player.options.appData.gemius.identifier = 'nG3qv4yhf5tCBFBDdg9Yd.WoDtwFYkNTUkvP5wgzgP7.Q7';
                player.options.appData.gemius.hitcollector = 'http://pro.hit.gemius.pl',

                gemius = new GemiusImplementationTest(player);
            } else {
                gemius = new GemiusImplementation(player);
            }

            //gemius = getQuerystring('testgemius', '') == 'true' ? new GemiusImplementationTest(player) : new GemiusImplementation(player);
            return player;
        }
    };
    return PlayerFactory;
});

/* Legacy support */
define("dr-widget-video-player-factory", ["dr-media-player-factory"], function(PlayerFactory) {
    "use strict";
    return PlayerFactory;
});
