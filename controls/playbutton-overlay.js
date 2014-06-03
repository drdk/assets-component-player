define('audio-control-play-button-overlay', ['dr-widget-media-dom-helper'], function (DomHelper) {

    /*jshint mootools:true*/
    'use strict';

    var PlayButtonOverlay = function (model) {

        var self = this;

        self.model = model;
        self.model.addEvent('play', onPlay);

        self.element = DomHelper.newElement('div', {
            text: 'Start afspilning',
            'class': 'pressPlay'
        });

        function onPlay () {
            self.element.style.display = 'none';
        }

        return self.element;
    };

    return PlayButtonOverlay;
});
