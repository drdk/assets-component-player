/* jshint devel: true */
/* global define: true */

define('dr-media-class', [], function () {
    'use strict';

    /**
     * Merge two objects. 'other' takes precedence.
     * Arrays gets concated, trythy get copied, objects gets merged with the previous rules.
     */
    function mergeObject(existing, other) {
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var isArray = Array.isArray || function(arr) {
            return Object.prototype.toString.call(arr) == '[object Array]';
        };
        for (var prop in other) {
            if (hasOwnProperty.call(existing, prop)) {
                if (isArray(existing[prop])) { //TODO: isArray not supported in IE8
                    // array:
                    if (isArray(other[prop])) {
                        existing[prop] = arrayUnique(existing[prop].concat(other[prop]));
                    } else {
                        //existing is array, but other is not...
                        throw 'Error merging array with non-array';
                    }
                //} else if (other[prop] && other[prop].toString() === '[object HTMLDivElement]' ) { //IE8 returns '[object]' hmm...
                } else if (other[prop] && other[prop].nodeType == 1 && other[prop].tagName !== undefined) {
                    existing[prop] = other[prop];
                } else if (typeof existing[prop] === 'object') {
                    // object:
                    if (typeof other[prop] === 'object') {
                        mergeObject(existing[prop], other[prop]);
                    } else {
                        //existing is object, but other is not...
                        throw 'Error merging object with non-object';
                    }
                } else if (other[prop]) {
                    // truthy:
                    existing[prop] = other[prop];
                }
            } else {
                try {
                    existing[prop] = other[prop];
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    /**
    * Merges two arrays and return a array with unique items
    */
    function arrayUnique(array) {
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }

    var MediaClass = function() {
        this.listeners = {};
        this.options = {};
        this.timeCodeConverter = {
            /**
            * @function
            * Converts timecode to seconds as a floating point number
            * @param {String}    timeCode    The timecode as a string. IE: HH:MM:SS or MM:SS or MM:SS.MS
            * @return {Number}
            */
            timeCodeToSeconds: function (timeCode) {
                var values = timeCode.split(':');
                values = values.reverse();
                return Number(values[0]) + (Number(values[1]) * 60) + (values.length > 2 ? (Number(values[2]) * 3600) : 0);
            },

            /**
            * @function
            * Converts timecode to a progress factor, where 0 is the beginning of the content and 1 is the end.
            * @param {String}    timeCode    The timecode as a string. IE: HH:MM:SS or MM:SS or MM:SS.MS
            * @param {Number}    length    The duration of the content in seconds as a floating point number
            */
            timeCodeToProgress: function (timeCode, length) {
                return this.timeCodeToSeconds(timeCode) / length;
            },

            /**
            * @function
            * Converts progress factor to timecode as a string. IE: HH:MM:SS or MM:SS
            * @param {Number}    progress    Progress as a number, where 0 is the beginning of the content and 1 is the end.
            * @param {Number}    length        The duration of the content in seconds as a floating point number
            * @param {bool}     forceHours     If true the time code will allways contain hours
            */
            progressToTimeCode: function (progress, length, forceHours) {
                return this.secondsToTimeCode(this.progressToSeconds(progress, length), forceHours);
            },

            /**
            * @function
            * Converts progress factor to seconds as a floating point number
            * @param {Number}    progress    Progress as a number, where 0 is the beginning of the content and 1 is the end.
            * @param {Number}    length        The duration of the content in seconds as a floating point number
            */
            progressToSeconds: function (progress, length) {
                return progress * length;
            },

            /**
            * @function
            * Converts from seconds as a floating point number to timecode as a string. IE: HH:MM:SS or MM:SS
            * @param {Number}    seconds        Seconds as a floating point number
            * @param {bool}     forceHours     If true the time code will allways contain hours
            */
            secondsToTimeCode: function (seconds, forceHours) {
                var min = Math.floor(seconds / 60);
                var sec = parseInt(seconds, 10) % 60;
                var hours = 0;
                if (min >= 60) {
                    hours = Math.floor(min / 60);
                    min = min % 60;
                }

                return (hours > 0 || forceHours ? (hours < 10 ? '0' + hours : hours) + ':' : '') + (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
            },

            /**
            * @function
            */
            unixTimeStampToTimeCode: function (timestamp) {
                var date = new Date(timestamp);

                var seconds = 0;

                if (date.hours > 0) seconds += date.hoursUTC * 60 * 60;
                if (date.minutes > 0) seconds += date.minutesUTC * 60;
                if (date.seconds > 0) seconds += date.secondsUTC;

                return this.secondsToTimeCode(seconds);
            },

            /**
            * @function
            * Converts from seconds as a floating point number to progress factor, where 0 is the beginning of the content and 1 is the end.
            * @param {Numver} seconds Seconds as a floating point number
            * @param {Number} length The duration of the content in seconds as a decimal number.
            */
            secondsToProgress: function (seconds, length) {
                return seconds / length;
            }
        };
    };
    MediaClass.prototype.addEvent = function (eventType, eventHandler, scope) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push({eh:eventHandler, s:scope});
    };
    MediaClass.prototype.fireEvent = function (eventType, payload) {
        if (this.listeners[eventType]) {
            for (var i=0; i < this.listeners[eventType].length; i++) {
                var handler = this.listeners[eventType][i];
                handler.eh.call(handler.s, payload);
            }
        }
    };
    MediaClass.prototype.removeEvent = function (eventType, eventHandler) {
        var pos = -1;
        if (this.listeners[eventType]) {
            for (var i = 0; i < this.listeners[eventType].length; i++) {
                if (eventHandler === this.listeners[eventType][i].eh) {
                    pos = i; break;
                }
            }
            if (pos > -1) {
                this.listeners[eventType].splice(pos, 1);
            }
        }
    };
    MediaClass.prototype.setOptions = function(options) {
        mergeObject(this.options, options);
    };
    MediaClass.prototype.json = function(url, successHandler, errorHandler, scope) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onreadystatechange = function() {
            if (this.readyState === 4){
                if (this.status >= 200 && this.status < 400){
                    var data = JSON.parse(this.responseText);
                    successHandler.call(scope, data);
                } else if (errorHandler) {
                    errorHandler.call(scope, this.status);
                }
            }
        };
        request.send();
        request = null;
    };

    MediaClass.inheritance = function (Child, Parent) {
        function F() {}
        F.prototype = Parent.prototype;
        Child.prototype = new F();
    };

    return MediaClass;
});
