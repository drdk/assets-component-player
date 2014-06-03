define('audio-control-settings-button', ['dr-widget-media-dom-helper'], function (DomHelper) {
	
	/*jshint mootools:true*/
	'use strict';

	var SettingsButton = function (model) {
		var self = this;

		self.model = model;
		self.element = DomHelper.newElement('div', {
			'class': 'settings',
			'style': 'display: none;'
		});
		self.toggle = DomHelper.newElement('button', {
			'class':'dr-icon-settings',
			'role':'presentation'
		});
		self.list = DomHelper.newElement('ul', {
			'style': 'display: none;'
		});

		self.element.appendChild(self.toggle);
		self.element.appendChild(self.list);

		function onClick () {
			if (self.list.style.display != 'none') {
				self.list.style.display = 'none';
			} else {
				self.list.style.display = 'block';
			}
		}
		function onChangeBitrate (event) {
			var e = event || window.event,
				t = e.target || e.srcElement;
			if(e.preventDefault) {
				e.preventDefault();
			} else {
				e.returnValue = false;
			}
			var kbps = t.getAttribute('data-kbps');
			if (kbps) {
				self.model.setNewBitrate(kbps);
				self.list.style.display = 'none';
			}
		}
		function buildMenu () {
			self.list.innerHTML = '';
			if (self.model.bitratesAvailable.length > 1) {
				for (var i=0; i<self.model.bitratesAvailable.length; i++) {
					var b = self.model.bitratesAvailable[i],
						element = DomHelper.newElement('li');
					element.appendChild(DomHelper.newElement('a', {
						'text': (b.bitrate > 0 ? b.bitrate + ' kbps' : 'Automatisk'),
						'href': '#',
						'data-kbps': b.bitrate,
						'title': (b.bitrate > 0 ? 'Skift kvalitet til ' + b.bitrate + ' kbps' : 'Vælg automatisk kvalitet'),
						'class': (self.model.options.appData.defaultQuality == b.bitrate ? 'selected' : '')
					}));
					self.list.appendChild(element);
				}
				self.element.style.display = 'block';
				DomHelper.addClass(self.model.options.element, 'has-settings');
			} else {
				self.element.style.display = 'none';
				DomHelper.removeClass(self.model.options.element, 'has-settings');
			}
		}
		function setSelected () {
			var selectedKbps = self.model.options.appData.defaultQuality,
				links = self.element.querySelector('li a');
			for (var i=0; i<links.length; i++) {
				var a = links[i];
				if (a.getAttribute('data-kbps') === selectedKbps) {
					DomHelper.addClass(a, 'selected');
				} else {
					DomHelper.removeClass('selected');
				}
			}
		}

		DomHelper.on(self.toggle, 'click', onClick);
		DomHelper.on(self.list, 'click', onChangeBitrate);
		self.model.addEvent('dr-widget-audio-player-bitrates-available', buildMenu, false);
		self.model.addEvent('dr-widget-audio-player-bitrate-selected', setSelected, false);

		return self.element;
	};

	return SettingsButton;
});