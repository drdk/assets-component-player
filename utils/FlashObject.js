/* jshint devel:true */
/* global define: true, escape: true, __flash__argumentsToXML: true, ActiveXObject: true */

/** 
 * Replacement for mootool's Swiff class. 
 * It a swfobject wrapper that implements Swiff's callbacks'
 * TODO: use swfobject 2.*
 **/
define('dr-media-flash-object', ['swfobject'], function (Swfobject) {
    'use strict';

    var $spawn = 0;

    function FlashObject (path, options) {

        var self = this;

        if (!options.container.id) {
            options.container.id = 'asdf';
        }

        self.id = 'dr_FlashObject_'+(++$spawn);
        self.so = new Swfobject(path, self.id, options.width, options.height, options.version, options.params.bgcolor);

        if (options.params) {
            for (var s in options.params) {
                if (options.params.hasOwnProperty(s)) {
                    self.so.addParam(s, options.params[s]);
                }
            }
        }

        if (options.vars) {
            for (var v in options.vars) {
                if (options.vars.hasOwnProperty(v)) {
                    self.so.addVariable(v, escape(options.vars[v]));
                }
            }
        }

        //Setup callback table:
        if (options.callBacks) {
            window.DR = window.DR || {};
            window.DR.FlashObjectCallbacks = window.DR.FlashObjectCallbacks || {};
            window.DR.FlashObjectCallbacks[self.id] = {};
            for (var c in options.callBacks) {
                if (options.callBacks.hasOwnProperty(c)) {
                    window.DR.FlashObjectCallbacks[self.id][c] = options.callBacks[c];
                    self.so.addVariable(c, 'window.DR.FlashObjectCallbacks.'+self.id+'.'+c);
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

    FlashObject.getFlashMajorVersion = function() {
        var fullVersion = FlashObject.getFlashFullVersion();
        return fullVersion.split(',')[0];
    };
    FlashObject.getFlashMinorVersion = function() {
        var fullVersion = FlashObject.getFlashFullVersion();
        if (fullVersion.split(',').length > 1) {
            return fullVersion.split(',')[1];
        }
        return '0';
    };
    FlashObject.getFlashFullVersion = function() {
        // ie
        try {
            try {
                // avoid fp6 minor version lookup issues
                // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
                var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
                try {
                    axo.AllowScriptAccess = 'always';
                } catch(e) {
                    return '6,0,0';
                }
            } catch(e) {
            }

            return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
            // other browsers
        } catch(e) {
            try {
                if(navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
                    return (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
                }
            } catch(error) { console.error('Unable to detect flash player version'); }
        }

        return '0,0,0';
    };

    return FlashObject;
});