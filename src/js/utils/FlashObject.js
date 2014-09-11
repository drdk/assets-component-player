/* jshint devel:true */
/* global define: true, escape: true, __flash__argumentsToXML: true, ActiveXObject: true */

/** 
 * Replacement for mootool's Swiff class. 
 * It a swfobject wrapper that implements Swiff's callbacks'
 * TODO: use swfobject 2.*
 **/
define('dr-media-flash-object', ['swfobject2', 'dr-widget-media-dom-helper'], function (Swfobject, DomHelper) {
    'use strict';

    var $spawn = 0;

    function FlashObject (path, options) {
        var self = this;
        self.id = 'dr_FlashObject_'+(++$spawn); 

        if (!options.container.id) {
            options.container.id = self.id + '_wrapper';
        }
        
        var replace = DomHelper.newElement('div', {'id':self.id});
        options.container.appendChild(replace);

        var attributes = {'data':path, 'width':options.width, 'height':options.height},
            params = {'id':self.id, 'bgcolor':options.params.bgcolor, 'wMode':'direct', 'AllowFullScreen':'true'},
            vars = [];

        if (options.params) {
            for (var p in options.params) {
                if (options.params.hasOwnProperty(p)) {
                    params[p] = options.params[p];
                }
            }
        }

        if (options.vars) {
            for (var v in options.vars) {
                if (options.vars.hasOwnProperty(v)) {
                    vars.push(v+'='+escape(options.vars[v]));
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
                    vars.push(c+'='+'window.DR.FlashObjectCallbacks.'+self.id+'.'+c);
                }
            }
        }

        params.flashvars = vars.join('&');
        self.objectElement = swfobject.createSWF(attributes, params, replace.id);

        self.remote = function (fn) {
            if (__flash__argumentsToXML) {
                return self.toElement().CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 1) + '</invoke>');
            } else {
                console.error('__flash__argumentsToXML is not defined!');
            }
        };

        self.toElement = function () {
            return self.objectElement;
        };

    }

    FlashObject.getFlashMajorVersion = function() {
        var fullVersion = FlashObject.getFlashFullVersion();

        var majorVersionStr = fullVersion.split(',')[0];

        if (majorVersionStr)
            return parseInt(majorVersionStr);

        return 0;
    };
    FlashObject.getFlashMinorVersion = function() {
        var fullVersion = FlashObject.getFlashFullVersion();

        if (fullVersion.split(',').length > 1) {
            return parseInt(fullVersion.split(',')[1]);
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
            } catch(error) {
                return '0,0,0'
            }
        }

        return '0,0,0';
    };

    return FlashObject;
});