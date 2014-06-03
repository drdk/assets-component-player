define('audio-control-volumeselector', ['dr-widget-media-dom-helper'], function (DomHelper) {

    /*jshint mootools:true*/
    'use strict';

    var VolumeSelector = function (model) {
        var self = this,
            steps = 5;

        self.model = model;
        self.isMuted = false;
        self.unmuteVolume = 0;
        self.element = DomHelper.newElement('div', { 'class': 'volume-selector' });
        
        for (var i = 0; i < (steps+1); i++) {
            var name = 'volume_' + self.model.mediaPlayerId,
                label = DomHelper.newElement('label', { 'for': name + '_' + i, 'text': i * 20 + '% lydstyrke' }),
                input = DomHelper.newElement('input', {type: 'radio', name: name, 'title': i * 20 + '% lydstyrke',  id: name + '_' + i })
            if (i===0) {
                DomHelper.addClass(label, 'dr-icon-audio-medium');
            }
            DomHelper.on(input, 'click', click);
            self.element.appendChild(label);
            self.element.appendChild(input);
        }

        function update () {
            var volume = self.model.volume();

            if (volume === 0) {
                DomHelper.addClass(self.element, 'muted');
            } else {
                DomHelper.removeClass(self.element, 'muted');
            }

            var list = self.element.querySelectorAll('input[type=radio]');
            var idx = Math.floor(volume * steps);

            if (idx > -1) {
                // support IE8 which can't style on :checked
                for (var i = 0; i < list.length; i++) {
                    DomHelper.removeClass(list[i], 'checked');
                    //list[i].removeAttribute('checked');
                }
                var input = list[idx];
                //input.setAttribute('checked', true);
                DomHelper.addClass(input, 'checked');
            }
        }

        function click (event) {
            var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            var idx = parseInt(t.getAttribute('id').split('_')[2]);

            if (idx === 0) {
                if (self.isMuted) {
                    self.model.volume(self.model.setVolume(self.unmuteVolume));
                    self.isMuted = false;
                } else {
                    self.isMuted = true;
                    self.unmuteVolume = self.model.volume();
                    self.model.setVolume(0);
                }
            } else {
                var volume = idx / steps;
                setTimeout(function () {
                    self.model.setVolume.call(self.model, volume);
                }, 0);
                self.isMuted = false;
            }
            setTimeout(saveVolume, 0);
        }

        function saveVolume() {
            if ('localStorage' in window && window.localStorage !== null) {
                localStorage['dr:netradio:volume'] = self.model.volume();
            }
        }

        function loadVolume() {
            if ('localStorage' in window && window.localStorage !== null) {
                var volume = Number(localStorage['dr:netradio:volume']) || 0.7; //Number("0") is falsy, mute will not be loaded
                setTimeout(function () {
                    self.model.setVolume.call(self.model, volume);
                }, 0);
            }
        }

        this.model.addEvent('volumechange', update);
        loadVolume();

        return self.element;
    };

    return VolumeSelector;
});
