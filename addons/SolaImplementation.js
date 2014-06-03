define("dr-media-sola-implementation", function () {
    "use strict";

    var SolaImplementation = new Class({
        initialize: function (player) {
            if (player.options.mediaType === 'audio') {
                window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = 'http://ma403-r.analytics.edgesuite.net/config/beacon-5186.xml';
            } else if (player.options.mediaType === 'video') {
                window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = 'http://ma403-r.analytics.edgesuite.net/config/beacon-5118.xml';
            } else {
                console.log('Unsupported mediaType received by SolaImplementation: ' + player.options.mediaType);
            }

		    this.player = player;
		    this.onPlay = this.bootstrap.bind(this);
		    this.player.addEvent('play', this.onPlay);
        },
        bootstrap: function () {
        	this.player.removeEvent('play', this.onPlay);

            if (this.player.options.mediaType === 'audio') {
                this.mediaElement = this.player.audioElement;
            } else {
                this.mediaElement = this.player.videoElement;
            }

            require(['sola'], function (){
                this.buildAndSendSolaMetadata();
                console.log ("media element: " + this.mediaElement);
                akamaiSetVideoObject(this.mediaElement);
                akamaiHandleStreamSwitch();
            }.bind(this));
        },
        getDeviceType : function() {
            var deviceType  = "Other";

            var userAgent = navigator.userAgent;
               
            deviceType = userAgent;
    
                if (userAgent == null)
                {
                    return deviceType;
                }
                
                if (userAgent.toLowerCase().indexOf("android") > -1) 
                {
                    if (userAgent.toLowerCase() === "Phone - Android")
                    {
                    } else 
                    {
                        deviceType = "Tablet - Android";
                    }

                } else if (userAgent.toLowerCase().indexOf("ipad") > -1) {
                    deviceType = "Tablet - IOS";
                } else if (userAgent.toLowerCase().indexOf("iphone") > -1) {
                    deviceType = "Phone - IOS";
                } else if (this.isWinTablet(userAgent)) {
                    deviceType = "Tablet - Windows";
                } else if (this.isWinPhone(userAgent)) {
                    deviceType = "Phone - Windows";
                } else if (userAgent.toLowerCase().indexOf("linux") > -1) {
                    deviceType = "Computer - Linux";
                } else if (userAgent.toLowerCase().indexOf("windows") > -1) {
                    deviceType = "Computer - Windows";
                } else if (userAgent.toLowerCase().indexOf("macintosh") > -1) {
                    deviceType = "Computer - Mac";
                }
                
            
            return deviceType;
        },
        getDeliveryType: function () 
        {
            var options = this.player.options;

            if (options.videoData.videoType === 'live') {
                var thisRef = this;
                var channels = options.videoData.channels.filter(function(element){return element.slug === thisRef.player.options.videoData.channelId});
                if (channels.length > 0) {
                    var channel = channels[0];

                    /**
                     * If the channel has a logo and a url it must be a regular broadcast channel.
                     * If the channel does not have these values it must be an event channel. Therefore deliveryType shoul be "L"
                     */
                    if (channel.logo.length > 0 && channel.url !== null) {
                        return "T";
                    }

                    return "L"
                    
                }

                // Weird. Channel is not in channel list
                return "L";
            }

            return "O";
        },
        isWinTablet: function(userAgent)
        {
            return userAgent.toLowerCase().indexOf("windows nt") > -1 && userAgent.toLowerCase().indexOf("touch") > -1;
        },
        isWinPhone: function (userAgent)
        {
            return userAgent.toLowerCase().indexOf("windows phone") > -1;
        },
        buildAndSendSolaMetadata: function() {
            var options = this.player.options;
            var eventName = '';
            
            if (options.videoData.videoType === 'live') {
                eventName = options.videoData.channelId;
            } else {
                if (this.player.productionNumber() !== null && this.player.productionNumber() !== undefined) {
                    eventName = '[' + this.player.productionNumber() + '] ' + this.player.resourceSlug();
                } else {
                    eventName = '[] ' + this.player.resourceSlug();
                }
            }
        
            //var eventName = options.videoData.videoType === 'live' ? options.videoData.programSerieSlug :'[' + this.player.productionNumber() + '] ' + options.videoData.programmeName;
            var playerId = "Global Assets 004.1";
            var device = this.getDeviceType();

            var log = '';
            log += "sola data:";
            log += "\n\teventName: " + eventName;
            log += "\n\tplayerId: " + playerId;
            log += "\n\tdevice: " + device;

            if (options.videoData.programSerieSlug !== undefined && options.videoData.programSerieSlug !== null) {
                log += "\n\tshow: " + options.videoData.programSerieSlug;
                setAkamaiMediaAnalyticsData("show", options.videoData.programSerieSlug);
            }

            if (this.player.resourceSlug() !== '') {
                setAkamaiMediaAnalyticsData("title", this.player.resourceSlug());
                log += "\n\ttitle: " + this.player.resourceSlug();
            }
            
            log += "\n\tdeliveryType: " + this.getDeliveryType();
          
            setAkamaiMediaAnalyticsData("eventName", eventName);
            
            if (options.videoData.genre) {
                setAkamaiMediaAnalyticsData("category", options.videoData.genre);
                log += "\n\tcategory: " + options.videoData.genre;
            }

            setAkamaiMediaAnalyticsData("device", device);
            setAkamaiMediaAnalyticsData("deliveryType", this.getDeliveryType());
            setAkamaiMediaAnalyticsData("playerId", playerId);
            
            if (options.videoData.videoType === 'live') {
                setAkamaiMediaAnalyticsData("channel", options.videoData.channelId);
                log += "\n\tchannel: " + options.videoData.channelId;
            } else {
                setAkamaiMediaAnalyticsData("productionNumber", this.player.productionNumber());
                log += "\n\tproductionNumber: " + this.player.productionNumber();
            }
            
            console.log(log);
        }
    });

    return SolaImplementation;
});