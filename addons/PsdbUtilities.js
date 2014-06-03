define("dr-media-psdb-utilities", function () {
    "use strict";
    //PSDB utilities, (should) contain every utility function that communicates with PSBD
    var psdbUtilities = new Class({
            initialize: function (player) {

            this.player = player;
            this.onPlayEvent = this.onPlay.bind(this);
            this.player.addEvent('play', this.onPlayEvent);

        },
        //Registers PSDB view, used to show most played
        registerView: function () {
            var requesturl = this.player.options.videoData.trackviewurl;
            var episodeurn = this.player.options.videoData.episodeurn;

            if(requesturl && episodeurn){
                    new Request({
                        url: requesturl,
                        onFailure: function () {
                        },
                    }).post('id=' + episodeurn);
            }
        },
        //Run onces when play event is fired, then unsubscribe to the event
        onPlay: function () {
            this.player.removeEvent('play', this.onPlayEvent);
            this.registerView();
        }
       
    });
    return psdbUtilities;
});

