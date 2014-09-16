/* jshint devel: true */
/* global define: true */

define('dr-media-hash-implementation', function () {
    'use strict';

    /**
    * Sets the current time code in documents location hash and starts seeking 
    * content if the document location hash changes.
    * Time code hash must be formatted as #!/HH:MM:SS or #!/MM:SS.
    * If more than one player is embedded on a page, this feature must be disabled
    * via options.enableHashTimeCode
    */

    var HashTimeCodeImplementation = function (player) {  

        var self = this;

        self.player = player;
        self.ignoreNextHashchange = false;


        function setTimeInHash ( timeCode ) {
            var hash = '#!/' + timeCode;

            if (document.location.hash.indexOf('#!/') === 0) {
                var settings = document.location.hash.substring(3).split(',');

                if (settings.length > 1) {
                    settings.shift();

                    var settingStr = settings.join(',');
                    hash += ',' + settingStr;
                }
            }

            if (window.location.hash != hash) {
                self.ignoreNextHashchange = true;
            }
            
            if ((navigator.userAgent.indexOf('Android') != -1)) {
                document.location = hash;
            } else {
                window.location.replace(hash);
            }
        }

        function hashChangeHandler () {
            if (!self.ignoreNextHashchange && document.location.hash.indexOf('#!/') === 0) {
                //var timeCode = document.location.hash.substring(3);
                var timeCode = getTimeCodeFromHash();
                if (timeCode !== '') {
                    self.player.seek(timeCode);
                    self.player.play();
                }
            }
            self.ignoreNextHashchange = false;
        }

        function onPlay () {
            setTimeInHash('');
        }

        function onPause () {
            if (self.player.options.videoData.videoType !== 'live') {
                setTimeInHash(self.player.currentTimeCode());
            }
        }

        function getTimeCodeFromHash () {
            var settings = document.location.hash.substring(3).split(',');
            if (settings && settings !== undefined) {
                return settings[0];
            }
        }

        self.player.addEvent('play', onPlay);
        self.player.addEvent('pause', onPause);

        if ('onhashchange' in window && 'addEventListener' in window) {
            window.addEventListener('hashchange', hashChangeHandler);
        } else if ('onhashchange' in window && 'attachEvent' in window) {
            window.attachEvent('onhashchange', hashChangeHandler);
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
                var timeCode = getTimeCodeFromHash();
                self.player.seek(timeCode);

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
                                if (value === 'true') {
                                    self.player.options.appData.autoPlay = true;
                                    self.player.build();
                                }
                            case 'assetType':
                                self.player.options.appData.assetType = value;
                            break;
                        }
                    }
                }
            }
        } else if (self.player.options.videoData.startTimeCode) {
            self.player.seek(self.player.options.videoData.startTimeCode);
        }

    };

    return HashTimeCodeImplementation;
});

