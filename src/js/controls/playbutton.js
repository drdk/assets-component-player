define('audio-control-play-button', ['dr-widget-media-dom-helper'], function (DomHelper) {

	'use strict';

	var PlayButton = function (model, playClass, pauseClass) {
		var self = this,
			playStateClass = playClass || 'dr-icon-play-large',
			pauseStateClass = pauseClass || 'dr-icon-pause-large';

		self.model = model;
		self.element = DomHelper.newElement('button', {
			'text':'Play',
			'class':playStateClass
		});

		function onClick (event) {
			if (!DomHelper.hasClass(self.element, 'disabled')) {
				DomHelper.addClass(self.element, 'disabled');
				if (DomHelper.hasClass(self.element, playStateClass)) {
					self.model.play();
				} else {
					self.model.pause();
				}
			}
		}
		function onPlay () {
			DomHelper.setAttributes(self.element, {
				'class': pauseStateClass,
				'text': 'Pause'
			});
		}
		function onPause () {
			DomHelper.setAttributes(self.element, {
				'class': playStateClass,
				'text': 'Play'
			});
		}

		self.model.addEvent('play', onPlay);
		self.model.addEvent('pause', onPause);
		DomHelper.on(self.element, 'click', onClick);

		return self.element;
	};

	return PlayButton;
});