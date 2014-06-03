define('audio-control-skip-buttons', ['dr-widget-media-dom-helper'], function (DomHelper) {

    /*jshint mootools:true*/
    'use strict';

    var SkipButtons = function (model) {

        var self = this;
        self.model = model;

        self.element = DomHelper.newElement('div', {'class': 'skip-buttons'});

        var prev = DomHelper.newElement('button', {
            text: 'Tilbage', 'class': 'dr-icon-back',
        });
        var next = DomHelper.newElement('button', {
            text: 'Frem', 'class': 'dr-icon-skip',
        });

        self.element.appendChild(prev);
        self.element.appendChild(next);

        DomHelper.on(prev, 'click', onPrevious);
        DomHelper.on(next, 'click', onNext);

        function onNext (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            seek(self.model.skipProvider.getNextPosition());
        }
        function onPrevious (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            seek(self.model.skipProvider.getPreviousPosition());
        } 
        function seek (pos) {
            if (pos || pos === 0) {
                var pct = 1.0 / self.model.duration() * pos;
                self.model.seek(pct);
            }
        }

        return self.element;
    };  

    return SkipButtons;
});
