/* jshint devel: true */
/* global define: true, SpringStreams: true */

define('dr-media-springstreams-implementation', ['springstreams'], function () {
    'use strict';

    var SpringstreamsImplementation = function (player){
        var self = this;
        self.player = player;

        self.sensors = new SpringStreams('vmdkstream');


        function bootstrap () {
            self.player.removeEvent('play', bootstrap);
            trackPlayEvent();
        }

        function trackPlayEvent () {
            var options = self.player.options;
            
            var date, time, channelId;
            var broadcastName = getBroadcastName();
            var streamId = getStreamId();
            var videoType = options.videoData.videoType == 'live' ? 'live' : 'OD';

            if (videoType === 'OD') {
                channelId = getODChannelId();
                date = getODBroadcastDate();
                time = getODBroadcastTime();
            } else {
                channelId = getLiveChannelId();
                date = getLiveBroadcastDate();
                time = getLiveBroadcastTime();
            }

            /**
             * Tag order:
             * BroadCaster_OD/Channel/Program/Season/Episode/DateBroadcast/TimeBroadcast/Streamid
             * BroadCaster_Live/Channel/Program/Season/Episode/DateBroadcast/TimeBroadcast/Streamid
             * (season og episode vil altid være NULL, da vi slet ikke er så avancerede)
             */
            var desc = {
                'stream':'DR_' + videoType + '/' + channelId + '/' + broadcastName + '/NULL/NULL/' + date + '/' + time + '/' + streamId,
                'duration': self.player.duration(),
                'cq': streamId
            };

            console.log('SpringstreamsImplementation.trackPlayEvent', self.sensors, self.player.videoElement, desc);
            self.sensors.track(self.player.videoElement, desc);
        }

        function getBroadcastName() {
            return typeof(self.player.resourceSlug() !== 'undefined') && self.player.resourceSlug() !== '' ? self.player.resourceSlug() : 'NULL';
        }

        function getStreamId() {
            var options = self.player.options;

            if (options.videoData.videoType === 'live') {
                return options.videoData.channelId;
            } else {
                var urn = typeof(self.player.urn()) !== 'undefined' ? self.player.urn() : self.player.productionNumber();
                urn = urn.split(':').join('_');
                return urn;
            }
        }

        function getODBroadcastDate() {
            if (self.player.programcardResult) {
                return self.player.programcardResult.PrimaryAssetStartPublish.split('T')[0];
            }

            return 'NULL';
        }

        function getODBroadcastTime() {
            if (self.player.programcardResult) {
                var time = self.player.programcardResult.PrimaryAssetStartPublish.split('T')[1].split('Z')[0];
                if (time)
                    time = time.split(':').join('.');
                
                return time;
            }

            return 'NULL';
        }

        function getODChannelId() {
            var pc = self.player.programcardResult;
            var channels = getChannelList();
            if (pc && typeof(pc.PrimaryChannel) !== 'undefined') {
                var channelNameArr = pc.PrimaryChannel.split('/');
                var channelSourceName = channelNameArr[channelNameArr.length-1].toLowerCase();
                return typeof(channels[channelSourceName]) !== 'undefined' ? channels[channelSourceName] : channels.fallback;
            }
            return channels.fallback;
        }

        function getLiveChannelId() {
            var channels = getChannelList();
            var channelId = self.player.options.videoData.channelId;
            channelId = channelId.replace('-', '');

            return typeof(channels[channelId]) !== 'undefined' ? channels[channelId] : channels.fallback;
        }

        function getLiveBroadcastTime() {
                var dateObj = self.player.options.videoData.primaryAssetStartPublish;
                if (dateObj !== null && dateObj !== undefined) {
                    var time = dateObj.split('T')[1].split('Z')[0];
                    if (time)
                        time = time.split(':').join('.');

                    return time;
                }

                return 'NULL';
        }

        function getLiveBroadcastDate() {
                var dateObj = self.player.options.videoData.primaryAssetStartPublish;
                if (dateObj !== null && dateObj !== undefined) {
                    return dateObj.split('T')[0];
                }

                return 'NULL';
        }

        function getChannelList() {
            return { 
                dr1: 'DR1',
                dr2: 'DR2',
                dr3: 'DR3',
                tvr: 'DRRamasjang',
                tvl: 'DRUltra',
                tvk: 'DRK',
                drramasjang: 'DRRamasjang',
                drultra: 'DRUltra',
                drk: 'DRK',
                fallback: 'drdk'
            };
        }

        self.player.addEvent('play', bootstrap);
    };

    return SpringstreamsImplementation;
});