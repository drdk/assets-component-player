define("dr-media-springstreams-implementation", ["springstreams"], function (Springstreams) {
    "use strict";

    var SpringstreamsImplementation = new Class({
        initialize: function (player) {
            this.player = player;

            this.sensors = new SpringStreams("vmdkstream");

		    this.onPlay = this.bootstrap.bind(this);
		    this.player.addEvent('play', this.onPlay);
        },

        bootstrap: function () {
            this.player.removeEvent('play', this.onPlay);
            this.trackPlayEvent();
        },

        trackPlayEvent: function() {
            var options = this.player.options;
            var videoElement = this.player.videoElement;

            var date, time, channelId;
            var episode = this.player.resourceSlug();
            var productionNumber = this.player.productionNumber();
            var series = options.videoData.programSerieSlug;
            var filename = videoElement.currentSrc;
            var videoType = options.videoData.videoType == 'live' ? 'live' : 'OD';

            if (this.player.programcardResult) {
                var pc = this.player.programcardResult;

                if (pc.PrimaryChannel !== null && pc.PrimaryChannel !== undefined) {
                    var channelNameArr = pc.PrimaryChannel.split("/");
                    channelId = channelNameArr[channelNameArr.length-1];
                } else {
                    channelId = 'drdk';
                }

                //PrimaryAssetStartPublish: "2013-07-09T20:05:00Z"
                date = pc.PrimaryAssetStartPublish.split("T")[0];
                time = pc.PrimaryAssetStartPublish.split("T")[1].split("Z")[0];
            } else {
                channelId = options.videoData.channelId;

                var dateObj = options.videoData.primaryAssetStartPublish;
                if (dateObj !== null && dateObj !== undefined) {
                    date = dateObj.split("T")[0];
                    time = dateObj.split("T")[1].split("Z")[0];
                } else {
                    date = "";
                    time = "";
                }
            }

            var desc = {
                "stream":"DR_" + videoType + "/" + channelId + "/" + episode + "/NULL/NULL/" + date + "/" + time + "/" + productionNumber,
                "duration": this.player.duration()

                /**
                 * Tag order:
                 * "BroadCaster_OD/Channel/Program/Episode/Season/Date_First_Broadcast/Time_First_Broadcast/STREAMID"
                 * "BroadCaster_LIVE/Channel/Program/Episode/Season/Date_First_Broadcast/Time_First_Broadcast/STREAMID"
                 * (season og episode vil altid være NULL, da vi slet ikke er så avancerede)
                 */
            };
            this.sensors.track(this.player.videoElement, desc);
        }
    }
);

    return SpringstreamsImplementation;
});