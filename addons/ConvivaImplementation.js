/* jshint devel: true */
/* global define: true, Conviva: true, require: true */

define('dr-media-conviva-implementation', function () {
    'use strict';

    var ConvivaImplementation = function(player) {

        var self = this;

        self.SERVICE_URL = 'http://livepass.conviva.com';
        self.CUSTOMER_ID = 'c3.DR-DK';
        self.player = player;


        function bootstrap () {

            self.player.removeEvent('play', bootstrap);

             require(['conviva'], function (){
                if (typeof Conviva !== 'undefined' && Conviva && Conviva.LivePass && Conviva.LivePass.ready === false) {
                    setupConvivaLogging();
                    buildConvivaMetadata();
                }
            });
        }

        function setupConvivaLogging() {
            if (typeof Conviva !== 'undefined' && Conviva) {
                Conviva.LivePass.init(self.SERVICE_URL, self.CUSTOMER_ID, livePassNotifier );
                Conviva.LivePass.toggleTraces(false); // set to false in production
            }
        }

        function livePassNotifier ( convivaNotification ) {
            if ( convivaNotification.code === 0 ) {
                if (window.console && console.log) {
                    console.log( 'Conviva LivePass initialized successfully.' );
                }
            } else {
                if ( Conviva.LivePass.ready ) { // check if LivePass is already initialized
                    if (window.console && console.log) {
                        console.log( 'Conviva LivePass post-initialization feedback.\n ' +
                            '\tCode: ' + convivaNotification.code + ';\n ' +
                            '\tMessage: ' + convivaNotification.message );
                    }
                } else {
                    if (window.console && console.log) {
                        console.log( 'Conviva LivePass failed to initialize!\n ' +
                            '\tConviva metrics will not be captured! ' +
                            '\tCode: ' + convivaNotification.code + '; ' +
                            '\tMessage: ' + convivaNotification.message );
                    }
                }
            }
        }

        function buildConvivaMetadata () {
            // Make sure Conviva's HTML5_LIVEPASS_LIBRARY library has been loaded
            if (typeof Conviva !== 'undefined' && Conviva) {

                var options = self.player.options;
                var videoElement = self.player.videoElement;

                // Clean up the existing monitoring session
                Conviva.LivePass.cleanupMonitoringSession(videoElement);

                var sessionName = options.videoData.videoType === 'live' ? options.videoData.channelId : '[' + self.player.productionNumber() + '] ' + options.videoData.programmeName;
                var convivaMetadata = Conviva.ConvivaContentInfo.createInfoForLightSession( sessionName );

                if (videoElement.currentSrc.indexOf('akamaihd.net') > -1) {
                    convivaMetadata.cdnName = Conviva.ConvivaContentInfo.CDN_NAME_AKAMAI;
                } else if (videoElement.currentSrc.indexOf('dr.dk') > -1) {
                    convivaMetadata.cdnName = Conviva.ConvivaContentInfo.CDN_NAME_INHOUSE;
                } else {
                    convivaMetadata.cdnName = Conviva.ConvivaContentInfo.CDN_NAME_OTHER;
                }

                convivaMetadata.streamUrl = videoElement.currentSrc; // required
                convivaMetadata.isLive = options.videoData.videoType === 'live'; // required
                convivaMetadata.frameworkName = 'Global Assets Vanilla Player';
                convivaMetadata.frameworkVersion = '1';

                //convivaMetadata.bitrate // will be done when HTML5 bitrate switching is done
                convivaMetadata.bitrate = self.player.getCurrntBitrate();
                
                convivaMetadata.deviceType = Conviva.ConvivaContentInfo.DEVICE_TYPE_MOBILE;
                convivaMetadata.playerName = 'global-assets';

                var o = {};
                o.show = options.videoData.programmeName;

                switch ( options.videoData.videoType ) {
                    case 'live':
                        o.channel = options.videoData.channelId;
                        
                        var regex = /^([a-z]+:\/\/[a-z.]+)/i;
                        var match = videoElement.currentSrc.match(regex);
                        o.RtmpHost = match && match.length === 2 ? match[1] : '';
                    break;
                    case 'ondemand':
                        o.category = options.videoData.genre;
                        o.programSLUG = options.videoData.episodeSlug;
                        o.programSeriesSLUG = options.videoData.programSerieSlug; // TODO: Does this work in Flash???
                        o.RtmpHost = options.videoData.rtmpHost;
                    break;
                }

                convivaMetadata.tags = o;

                var session = Conviva.LivePass.createSession(videoElement, convivaMetadata);

                //session.setCurrentBitrate( newBitrateKbps );
                if (options.videoData.videoType === 'ondemand') {
                    session.setContentLength(self.player.duration());
                }

            } else {

                if (window.console && console.log) {
                    console.log('error: conviva meta data not created!');
                }
            }
        }

        self.player.addEvent('play', bootstrap);
    };

    return ConvivaImplementation;
});