/* jshint devel: true */
/* global define: true */

define('video-control-accessability-controls', ['dr-widget-media-dom-helper'], function (DomHelper) {

	'use strict';

	var AccessabilityControls = function (model) {

		var self = this;
		self.model = model;

		build();
		
		
		function build () {
			var container = DomHelper.newElement('div', {'class': 'accessability-controls'});
			self.model.options.element.appendChild(container);

			var play = DomHelper.newElement('button', {'text':'Afspil video'});
			DomHelper.on(play, 'click', function () {
				self.model.play();
			});
			container.appendChild(play);

			if (self.model.options.videoData.videoType == 'live') {

				var stop = DomHelper.newElement('button', {'text':'Stop video'});
				DomHelper.on(stop, 'click', function () {
					self.model.pause();
				});
				container.appendChild(stop);

			} else {

				var pause = DomHelper.newElement('button', {'text':'Sæt videoen på pause'});
				DomHelper.on(pause, 'click', function () {
					self.model.pause();
				});
				container.appendChild(pause);

			}
		}
	};

	return AccessabilityControls;

});
