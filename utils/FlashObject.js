/* jshint -W110 */
/* global define: true, _gaq: true */

/** 
 * Replacement for mootool's Swiff class. 
 * It a swfobject wrapper that implements Swiff's callbacks
 **/
define("dr-media-flash-object", ["swfobject"], function (swfobject) {
    "use strict";

    var $spawn = 0;

    function FlashObject (path, options) {

        var self = this;

        if (!options.container.id) {
            options.container.id = "asdf";
        }

        self.id = 'dr_FlashObject_'+(++$spawn);
        self.so = new swfobject(path, self.id, options.width, options.height, options.version, options.params.bgcolor);

        if (options.params) {
            for (var s in options.params) {
                if (options.params.hasOwnProperty(s)) {
                    self.so.addParam(s, options.params[s]);
                }
            }
        }

        if (options.vars) {
            for (var s in options.vars) {
                if (options.vars.hasOwnProperty(s)) {
                    self.so.addVariable(s, escape(options.vars[s]));
                }
            }
        }

        //Setup callback table:
        if (options.callBacks) {
            window.DR = window.DR || {};
            window.DR.FlashObjectCallbacks = window.DR.FlashObjectCallbacks || {};
            window.DR.FlashObjectCallbacks[self.id] = {};
            for (var s in options.callBacks) {
                if (options.callBacks.hasOwnProperty(s)) {
                    window.DR.FlashObjectCallbacks[self.id][s] = options.callBacks[s];
                    self.so.addVariable(s, 'window.DR.FlashObjectCallbacks.'+self.id+'.'+s);
                }
            }
        }

        self.so.write(options.container.id);

        self.remote = function (fn) {
            if (__flash__argumentsToXML) {
                return self.toElement().CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 1) + '</invoke>');
            } else {
                console.error('__flash__argumentsToXML is not defined!');
            }
        };

        self.toElement = function () {
            return document.getElementById(self.id);
        };

    }

    return FlashObject;
});