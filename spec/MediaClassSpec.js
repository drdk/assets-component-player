define(['dr-media-class', 'jasmine-ajax'], function (MediaClass, jasmine) {

	describe('MediaClass', function () {

		var mediaClass = null;

		//Array.indexOf Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function(searchElement, fromIndex) {
			var k;
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}
			var O = Object(this);
			var len = O.length >>> 0;

			if (len === 0) {
				return -1;
			}
			var n = +fromIndex || 0;
			if (Math.abs(n) === Infinity) {
				n = 0;
			}
			if (n >= len) {
				return -1;
			}
			k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
			while (k < len) {
				var kValue;
				if (k in O && O[k] === searchElement) {
				return k;
				}
				k++;
			}
			return -1;
			};
		}

		beforeEach(function () {
			mediaClass = new MediaClass();
		});
		afterEach(function () {
			mediaClass = null;
		});

		describe('addEvent', function () {

			it('should add an event listener', function () {
				mediaClass.addEvent('KAPOW', function() {});
				expect(mediaClass.listeners.KAPOW.length).toEqual(1);
			});

			it('should add multiple event listeners', function () {
				mediaClass.addEvent('KAPOW', function() {});
				mediaClass.addEvent('KAPOW', function() {});
				mediaClass.addEvent('KAPOW', function() {});
				expect(mediaClass.listeners.KAPOW.length).toEqual(3);
			});

		});

		describe('removeEvent', function () {

			it('should remove event listener', function () {
				function handler () { }
				mediaClass.addEvent('KAPOW', handler);
				expect(mediaClass.listeners.KAPOW.length).toEqual(1);
				mediaClass.removeEvent('KAPOW', handler);
				expect(mediaClass.listeners.KAPOW.length).toEqual(0);
			});

			it('should remove one event listener', function () {
				function handlerA () { }
				function handlerB () { }
				function handlerC () { }
				mediaClass.addEvent('KAPOW', handlerA);
				mediaClass.addEvent('KAPOW', handlerB);
				mediaClass.addEvent('KAPOW', handlerC);
				expect(mediaClass.listeners.KAPOW.length).toEqual(3);
				mediaClass.removeEvent('KAPOW', handlerB);
				expect(mediaClass.listeners.KAPOW.length).toEqual(2);
			});

		});

		describe('fireEvent', function () {

			it('should fire an evnet with a payload', function (done) {
				function handlerA(payload){
					expect(payload).toEqual('BAM!');
					done();
				}
				mediaClass.addEvent('KAPOW', handlerA);
				mediaClass.fireEvent('KAPOW', 'BAM!');
			});

			it('should fire an evnet handler in correct scope', function (done) {
				var scope = {};
				function handlerA(){
					expect(this).toEqual(scope);
					done();
				}
				mediaClass.addEvent('KAPOW', handlerA, scope);
				mediaClass.fireEvent('KAPOW');
			});

			it('should fire multiple evnets with a payload', function () {
				var handlers = {
					handlerA: function (){},
					handlerB: function (){},
					handlerC: function (){}
				};
				spyOn(handlers, 'handlerA');
				spyOn(handlers, 'handlerB');
				spyOn(handlers, 'handlerC');
				mediaClass.addEvent('KAPOW', handlers.handlerA);
				mediaClass.addEvent('KAPOW', handlers.handlerB);
				mediaClass.addEvent('KAPOW', handlers.handlerC);
				mediaClass.fireEvent('KAPOW', 'BAM!');
				expect(handlers.handlerA).toHaveBeenCalledWith('BAM!');
				expect(handlers.handlerB).toHaveBeenCalledWith('BAM!');
				expect(handlers.handlerC).toHaveBeenCalledWith('BAM!');
			});

			it('should not fire evnets to removed listeners', function () {
				var handlers = {
					handlerA: function (){},
					handlerB: function (){},
					handlerC: function (){}
				};
				spyOn(handlers, 'handlerA');
				spyOn(handlers, 'handlerB');
				spyOn(handlers, 'handlerC');
				mediaClass.addEvent('KAPOW', handlers.handlerA);
				mediaClass.addEvent('KAPOW', handlers.handlerB);
				mediaClass.addEvent('KAPOW', handlers.handlerC);
				mediaClass.removeEvent('KAPOW', handlers.handlerB);
				mediaClass.fireEvent('KAPOW', 'BAM!');
				expect(handlers.handlerA).toHaveBeenCalledWith('BAM!');
				expect(handlers.handlerB).not.toHaveBeenCalled();
				expect(handlers.handlerC).toHaveBeenCalledWith('BAM!');
			});

			it('should not mess up other event handlers if a handler removes itsels', function () {
				var handlers = {
					handlerA: function (){},
					handlerB: function (){
						mediaClass.removeEvent('KAPOW', handlers.handlerB);
					},
					handlerC: function (){}
				};
				spyOn(handlers, 'handlerA');
				spyOn(handlers, 'handlerB').and.callThrough();
				spyOn(handlers, 'handlerC');
				mediaClass.addEvent('KAPOW', handlers.handlerA);
				mediaClass.addEvent('KAPOW', handlers.handlerB);
				mediaClass.addEvent('KAPOW', handlers.handlerC);
				mediaClass.fireEvent('KAPOW');
				expect(handlers.handlerA.calls.count()).toEqual(1);
				expect(handlers.handlerB.calls.count()).toEqual(1);
				expect(handlers.handlerC.calls.count()).toEqual(1);
				mediaClass.fireEvent('KAPOW');
				expect(handlers.handlerA.calls.count()).toEqual(2);
				expect(handlers.handlerB.calls.count()).toEqual(1);
				expect(handlers.handlerC.calls.count()).toEqual(2);
			});

		});

		describe('setOptions', function () {

			it('should merge two objects', function () {
				mediaClass.setOptions({'a':1});
				mediaClass.setOptions({'b':2});
				expect(mediaClass.options.a).toEqual(1);
				expect(mediaClass.options.b).toEqual(2);
			});

			it('should merge two arrays', function () {
				mediaClass.setOptions({'a':['x', 'y']});
				mediaClass.setOptions({'a':[1, 2]});
				expect(mediaClass.options.a.length).toEqual(4);
				expect(mediaClass.options.a.indexOf(1)).not.toEqual(-1);
				expect(mediaClass.options.a.indexOf(2)).not.toEqual(-1);
				expect(mediaClass.options.a.indexOf('x')).not.toEqual(-1);
				expect(mediaClass.options.a.indexOf('y')).not.toEqual(-1);
			});

			it('should merge two arrays unique', function () {
				mediaClass.setOptions({'a':['x', 'y']});
				mediaClass.setOptions({'a':['x', 'z']});
				expect(mediaClass.options.a.length).toEqual(3);
				expect(mediaClass.options.a.indexOf('x')).not.toEqual(-1);
				expect(mediaClass.options.a.indexOf('y')).not.toEqual(-1);
				expect(mediaClass.options.a.indexOf('z')).not.toEqual(-1);
			});

			it('should overwrite properties in objects', function () {
				mediaClass.setOptions({'a':'old value'});
				mediaClass.setOptions({'a':'new value'});
				expect(mediaClass.options.a).toEqual('new value');
			});

			it('should merge objects deep', function () {
				mediaClass.setOptions({a:{b:{c:'OLD!'}}});
				mediaClass.setOptions({a:{b:{c:'NEW!'}}});
				expect(mediaClass.options.a.b.c).toEqual('NEW!');
			});

			it('should throw an error when merging a string with an array', function () {
				mediaClass.setOptions({'a':['I\'m a string in an array']});
				expect(function () {
					mediaClass.setOptions({'a':'I\'m a string!'});
				}).toThrow();
			});

			it('should throw an error when merging a string with an object', function () {
				mediaClass.setOptions({'a':{'b':'I\'m a string in an object'}});
				expect(function () {
					mediaClass.setOptions({'a':'I\'m a string!'});
				}).toThrow();
			});

		});

	});
});