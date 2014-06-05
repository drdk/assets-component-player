﻿/* jshint devel: true */
/* global define: true */

define('dr-media-psdb-utilities', function () {
    'use strict';
    //PSDB utilities, (should) contain every utility function that communicates with PSBD
    var psdbUtilities = function(player) {
        var self = this;
        this.player = player;

        function registerView () {
            console.log('psdbUtilities.registerView');
            var requesturl = self.player.options.videoData.trackviewurl;
            var episodeurn = self.player.options.videoData.episodeurn;

            if(requesturl && episodeurn){
                var httpRequest = new XMLHttpRequest();
                httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                httpRequest.open('POST', requesturl);
                httpRequest.send('id=' + encodeURIComponent(episodeurn));
            }
        }

        function onPlay () {
            console.log('psdbUtilities.onPlay');
            self.player.removeEvent('play', onPlay);
            registerView();
        }

        self.player.addEvent('play', onPlay);
    };

    return psdbUtilities;
});