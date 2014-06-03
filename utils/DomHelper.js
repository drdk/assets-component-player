define('dr-widget-media-dom-helper', [], function () {

	'use strict';

	var Helper = {
		on: function (el, eventType, eventHandler) {
			if (el.addEventListener) {
				el.addEventListener(eventType, eventHandler);
			} else {
				el.attachEvent('on' + eventType, function(){
					eventHandler.call(el);
				});
			}
		},
		off: function (el, eventType, eventHandler) {
			if (el.removeEventListener) {
				el.removeEventListener(eventType, eventHandler);
			} else {
			    el.detachEvent('on' + eventType, eventHandler);
			}
		},
		newElement: function (tagName, attributes) {
			var el = document.createElement(tagName);
			if (attributes) {
				if (attributes.text) {
					var tn = document.createTextNode(attributes.text);
					el.appendChild(tn);
				}
				this.setAttributes(el, attributes);
			}
			return el;
		},
		addClass: function (element, className) {
			if (element.classList) {
				element.classList.add(className);
			} else {
				element.className += ' ' + className;
			}
		},
		hasClass: function (element, className) {
			if (element.classList) {
				element.classList.contains(className);
			} else {
				new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
			}
		},
		removeClass: function (element, className) {
			if (element.classList) {
				element.classList.remove(className);
			} else {
				element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		},
		setAttributes: function (element, attributes) {
			for (var s in attributes) {
				attributes.hasOwnProperty(s) && s != 'text' && element.setAttribute(s, attributes[s]);
			}
		}
	};

	return Helper;

});