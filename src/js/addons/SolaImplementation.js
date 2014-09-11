/* jshint devel: true */
/* global define: true, require: true, akamaiSetVideoObject: true, akamaiHandleStreamSwitch:true, setAkamaiMediaAnalyticsData: true */

define('dr-media-sola-implementation', function () {
    'use strict';

    var SolaImplementation = function (player) {
        
        var self = this;

        self.player = player;


        if (player.options.mediaType === 'audio') {
            window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = 'http://ma403-r.analytics.edgesuite.net/config/beacon-5186.xml';
        } else if (player.options.mediaType === 'video') {
            window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = 'http://ma403-r.analytics.edgesuite.net/config/beacon-5118.xml';
        } else {
            if (console) {
                console.log('Unsupported mediaType received by SolaImplementation: ' + player.options.mediaType);
            }
        }

        function bootstrap() {
            self.player.removeEvent('play', bootstrap);

            if (self.player.options.mediaType === 'audio') {
                self.mediaElement = self.player.audioElement;
            } else {
                self.mediaElement = self.player.videoElement;
            }

            require(['sola'], function (){
                buildAndSendSolaMetadata();
                akamaiSetVideoObject(self.mediaElement);
                akamaiHandleStreamSwitch();
            });
        }

        function getDeviceType () {
            var deviceType  = 'Other';
            var userAgent = navigator.userAgent;
            deviceType = userAgent;
            if (userAgent === null)
            {
                return deviceType;
            }
            if (userAgent.toLowerCase().indexOf('android') > -1) 
            {
                if (userAgent.toLowerCase() === 'Phone - Android') {    
                } else {
                    deviceType = 'Tablet - Android';
                }

            } else if (userAgent.toLowerCase().indexOf('ipad') > -1) {
                deviceType = 'Tablet - IOS';
            } else if (userAgent.toLowerCase().indexOf('iphone') > -1) {
                deviceType = 'Phone - IOS';
            } else if (isWinTablet(userAgent)) {
                deviceType = 'Tablet - Windows';
            } else if (isWinPhone(userAgent)) {
                deviceType = 'Phone - Windows';
            } else if (userAgent.toLowerCase().indexOf('linux') > -1) {
                deviceType = 'Computer - Linux';
            } else if (userAgent.toLowerCase().indexOf('windows') > -1) {
                deviceType = 'Computer - Windows';
            } else if (userAgent.toLowerCase().indexOf('macintosh') > -1) {
                deviceType = 'Computer - Mac';
            }
            return deviceType;
        }

        function getDeliveryType () {
            var options = self.player.options;
            if (options.videoData.videoType === 'live') {
                var channels = options.videoData.channels;// TODO .filter(function(element){return element.slug === thisRef.player.options.videoData.channelId});
                if (channels.length > 0) {
                    var channel = channels[0];

                    if (channel.webChannel === true) {
                        return 'L';
                    }

                    return 'T';
                }

                // Weird. Channel is not in channel list
                return 'L';
            }
            
            return 'O';
        }

        function isWinTablet (userAgent) {
            return userAgent.toLowerCase().indexOf('windows nt') > -1 && userAgent.toLowerCase().indexOf('touch') > -1;
        }
        function isWinPhone (userAgent) {
            return userAgent.toLowerCase().indexOf('windows phone') > -1;
        }
        function buildAndSendSolaMetadata () {
            var options = self.player.options;
            var eventName = '';
            
            if (options.videoData.videoType === 'live') {
                eventName = options.videoData.channelId;
            } else {
                if (self.player.productionNumber() !== null && self.player.productionNumber() !== undefined) {
                    eventName = '[' + self.player.productionNumber() + '] ' + self.player.resourceSlug();
                } else {
                    eventName = '[] ' + self.player.resourceSlug();
                }
            }
        
            //var eventName = options.videoData.videoType === 'live' ? options.videoData.programSerieSlug :'[' + self.player.productionNumber() + '] ' + options.videoData.programmeName;
            var playerId = '/tv HTML5 player v. 1.0';
            var device = getDeviceType();

            var log = '';
            log += 'sola data:';
            log += '\n\teventName: ' + eventName;
            log += '\n\tplayerId: ' + playerId;
            log += '\n\tdevice: ' + device;

            if (options.videoData.programSerieSlug !== undefined && options.videoData.programSerieSlug !== null) {
                log += '\n\tshow: ' + options.videoData.programSerieSlug;
                setAkamaiMediaAnalyticsData('show', options.videoData.programSerieSlug);
            }

            if (self.player.resourceSlug() !== '') {
                setAkamaiMediaAnalyticsData('title', self.player.resourceSlug());
                log += '\n\ttitle: ' + self.player.resourceSlug();
            }
            
            log += '\n\tdeliveryType: ' + getDeliveryType();
          
            setAkamaiMediaAnalyticsData('eventName', eventName);
            
            if (options.videoData.genre) {
                setAkamaiMediaAnalyticsData('category', options.videoData.genre);
                log += '\n\tcategory: ' + options.videoData.genre;
            }

            setAkamaiMediaAnalyticsData('device', device);
            setAkamaiMediaAnalyticsData('deliveryType', getDeliveryType());
            setAkamaiMediaAnalyticsData('playerId', playerId);
            
            if (options.videoData.videoType === 'live') {
                setAkamaiMediaAnalyticsData('channel', options.videoData.channelId);
                log += '\n\tchannel: ' + options.videoData.channelId;
            } else {
                setAkamaiMediaAnalyticsData('productionNumber', self.player.productionNumber());
                log += '\n\tproductionNumber: ' + self.player.productionNumber();
            }
            
            console.log(log);
        }

        self.player.addEvent('play', bootstrap);
    };

    return SolaImplementation;
});