/* jshint devel: true */
/* global define: true */

/**
 * TODO: rewrite or remove Browser property
 **/
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
		cancelEvent: function(evnet) {
			var e = event || window.event,
                t = e.target || e.srcElement;
            if(e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
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
				if (attributes.hasOwnProperty(s) && s != 'text') {
					element.setAttribute(s, attributes[s]);
				}
			}
		},
		Browser: {
			Platform: {
				ios: ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false ),
				android: ( navigator.userAgent.match(/android/g) ? true : false )
			},
			ie8: navigator.userAgent.toLowerCase().match(/msie 8/) ? true : false
		}
	};

	return Helper;
});