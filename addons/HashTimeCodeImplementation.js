define("dr-media-hash-implementation", function () {
    "use strict";

    /*jshint mootools:true,browser:true */

    /**
    * Sets the current time code in documents location hash and starts seeking 
    * content if the document location hash changes.
    * Time code hash must be formatted as #!/HH:MM:SS or #!/MM:SS.
    * If more than one player is embedded on a page, this feature must be disabled
    * via options.enableHashTimeCode
    */
    var HashTimeCodeImplementation = new Class({
        /**
        * Instance of an AbstractPlayer
        * @type {AbstractPlayer}
        */
        player: null,
        ignoreNextHashchange: false,
        initialize: function (player) {
            this.player = player;

            this.player.addEvent('play', this.onPlay.bind(this));
            this.player.addEvent('pause', this.onPause.bind(this));

            if ('onhashchange' in window && 'addEventListener' in window) {
                window.addEventListener('hashchange', this.hashChangeHandler.bind(this));
            } else if ('onhashchange' in window && 'attachEvent' in window) {
                window.attachEvent('onhashchange', this.hashChangeHandler.bind(this));
            }

            /**
             *  The structure of the hash data is this:
             *  #!/{timeCode},{key=value},{key=value}
             *  
             *  Example:
             *  #!/10:05,autoplay=true
             *  
             *  So, make sure the timecode slot is always included.
             *  If no time code is specified, but a key/value entry is, the hash should look like this:
             *  #!/,{key=value}
             */
            //initial seek (deep link):
            if (document.location.hash.indexOf('#!/') === 0) {
                var settings = document.location.hash.substring(3).split(',');
                if (settings && settings !== undefined) {
                    var timeCode = this.getTimeCodeFromHash();
                    this.player.seek(timeCode);

                    if (settings.length > 1) {
                        for (var i = 1; i < settings.length; i++) {
                            var keyValCollection = settings[i].split('=');

                            // Don't handle entry if we don't have both a key and a value
                            if (keyValCollection.length < 2) {
                                continue;
                            }

                            var key = keyValCollection[0];
                            var value = keyValCollection[1];

                            switch(key) {
                                case 'autoplay':
                                    if (value === 'true')
                                        this.player.options.appData.autoPlay = true;
                                        this.player.build();
                                break;
                            }
                        };
                    }
                }
            } else if (this.player.options.videoData.startTimeCode) {
                this.player.seek(this.player.options.videoData.startTimeCode);
            }

        },
        setHash: function (value) {
            var hash = '#!/' + value;
            if (window.location.hash != hash) {
                this.ignoreNextHashchange = true;
            }
            window.location.replace('#!/' + value);
        },
        hashChangeHandler: function (event) {
            if (!this.ignoreNextHashchange && document.location.hash.indexOf('#!/') === 0) {
                //var timeCode = document.location.hash.substring(3);
                var timeCode = this.getTimeCodeFromHash();
                if (timeCode !== "") {
                    this.player.seek(timeCode);
                    this.player.play();
                }
            }
            this.ignoreNextHashchange = false;
        },
        onPlay: function () {
            //if (this.player.options.videoData.videoType !== "live") {
                this.setHash('');
            //}
        },
        onPause: function () {
            if (this.player.options.videoData.videoType !== "live") {
                this.setHash(this.player.currentTimeCode());
            }
        },
        getTimeCodeFromHash: function () {
            var settings = document.location.hash.substring(3).split(',');
            if (settings && settings !== undefined) {
                return settings[0];
            }
        }
    });
    return HashTimeCodeImplementation;
});
