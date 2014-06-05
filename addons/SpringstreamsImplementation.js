/* jshint devel: true */
/* global define: true, SpringStreams: true */

define('dr-media-springstreams-implementation', ['springstreams'], function () {
    'use strict';

    var SpringstreamsImplementation = function (player){
        var self = this;
        self.player = player;

        self.sensors = new SpringStreams('vmdkstream'); // ???


        function bootstrap () {
            self.player.removeEvent('play', bootstrap);
            trackPlayEvent();
        }

        function trackPlayEvent () {
            var options = self.player.options;
            var videoElement = self.player.videoElement;

            var date, time, channelId;
            var episode = self.player.resourceSlug();
            var productionNumber = self.player.productionNumber();
            var series = options.videoData.programSerieSlug;
            var filename = videoElement.currentSrc;
            var videoType = options.videoData.videoType == 'live' ? 'live' : 'OD';

            if (self.player.programcardResult) {
                var pc = self.player.programcardResult;

                if (pc.PrimaryChannel !== null && pc.PrimaryChannel !== undefined) {
                    var channelNameArr = pc.PrimaryChannel.split('/');
                    channelId = channelNameArr[channelNameArr.length-1];
                } else {
                    channelId = 'drdk';
                }

                //PrimaryAssetStartPublish: '2013-07-09T20:05:00Z'
                date = pc.PrimaryAssetStartPublish.split('T')[0];
                time = pc.PrimaryAssetStartPublish.split('T')[1].split('Z')[0];
            } else {
                channelId = options.videoData.channelId;

                var dateObj = options.videoData.primaryAssetStartPublish;
                if (dateObj !== null && dateObj !== undefined) {
                    date = dateObj.split('T')[0];
                    time = dateObj.split('T')[1].split('Z')[0];
                } else {
                    date = '';
                    time = '';
                }
            }

            var desc = {
                'stream':'DR_' + videoType + '/' + channelId + '/' + episode + '/NULL/NULL/' + date + '/' + time + '/' + productionNumber,
                'duration': self.player.duration()

                /**
                 * Tag order:
                 * 'BroadCaster_OD/Channel/Program/Episode/Season/Date_First_Broadcast/Time_First_Broadcast/STREAMID'
                 * 'BroadCaster_LIVE/Channel/Program/Episode/Season/Date_First_Broadcast/Time_First_Broadcast/STREAMID'
                 * (season og episode vil altid være NULL, da vi slet ikke er så avancerede)
                 */
            };
            console.log('SpringstreamsImplementation.trackPlayEvent', self.sensors, self.player.videoElement, desc);
            self.sensors.track(self.player.videoElement, desc);
        }

        self.player.addEvent('play', bootstrap);
    };

    return SpringstreamsImplementation;
});