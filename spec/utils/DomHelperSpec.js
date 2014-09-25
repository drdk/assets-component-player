define(['dr-widget-media-dom-helper', 'jasmine-ajax'], function (DomHelper, jasmine) {


	var element = document.getElementById('test-player');

	describe('DomHelper', function () {

		beforeEach(function () {
			element.innerHTML = '';
		});

		afterEach(function () {
			element.innerHTML = '';
		});

		describe('dom events', function () {

			it('should add an event listener', function (done) {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				DomHelper.on(el, 'click', function (e) {
					expect(e.target || e.srcElement).toEqual(el);
					expect(e).not.toEqual(null);
					done();
				});
				DomHelper.trigger(el, 'click');
			});

			it('should remove an event listener', function (done) {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				var ok = true;
				function handler1 () {
					ok = false;
				}
				function handler2 () {
					expect(ok).toEqual(true);
					done();
				}
				DomHelper.on(el, 'click', handler1);
				DomHelper.on(el, 'click', handler2);
				DomHelper.off(el, 'click', handler1);
				DomHelper.trigger(el, 'click');
			});

			it('should trigger multiple event listeners', function (done) {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				var num = 0;
				function handler1 () {
					num++;
				}
				function handler2 () {
					num++;
					expect(num).toEqual(2);
					done();
				}
				DomHelper.on(el, 'click', handler1);
				DomHelper.on(el, 'click', handler2);
				DomHelper.trigger(el, 'click');
			});

		});

		describe('newElement', function () {

			it('should create new element', function () {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div></div>');
			});

			it('should create new element with attributes', function () {
				var el = DomHelper.newElement('div', {'data-test':'test'});
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div data-test="test"></div>');
			});

			it('should create new element with class attribute', function () {
				var el = DomHelper.newElement('div', {'class':'test'});
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div class="test"></div>');
			});

			it('should create new element with text', function () {
				var el = DomHelper.newElement('div', {'text':'test'});
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div>test</div>');
			});

		});

		describe('addClass', function () {

			it('should add class to element before insertion', function () {
				var el = DomHelper.newElement('div');
				DomHelper.addClass(el, 'test');
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div class="test"></div>');
			});

			it('should add class to element after insertion', function () {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				DomHelper.addClass(el, 'test');
				expect(element.innerHTML).toEqual('<div class="test"></div>');
			});

			it('should add multiple classes to element', function () {
				var el = DomHelper.newElement('div');
				element.appendChild(el);
				DomHelper.addClass(el, 'test');
				DomHelper.addClass(el, 'test2');
				expect(element.innerHTML).toEqual('<div class="test test2"></div>');
			});

		});

		describe('hasClass', function () {

			it('should return true if element has class', function () {
				var el = DomHelper.newElement('div');
				DomHelper.addClass(el, 'test');
				expect(DomHelper.hasClass('test')).toEqual(true);
			});

			it('should return false if element does not have the class', function () {
				var el = DomHelper.newElement('div');
				DomHelper.addClass(el, 'test2');
				expect(DomHelper.hasClass(el, 'test')).toEqual(false);
			});

		});

		describe('removeClass', function () {

			it('should remove a class', function () {
				var el = DomHelper.newElement('div');
				DomHelper.addClass(el, 'test');
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div class="test"></div>');
				DomHelper.removeClass(el, 'test');
				expect(DomHelper.hasClass(element, 'test')).toEqual(false);
				// expect(element.innerHTML).toEqual('<div class=""></div>');
			});

			it('should remove one of many classes', function () {
				var el = DomHelper.newElement('div', {
					'class':'test test2'
				});
				element.appendChild(el);
				expect(element.innerHTML).toEqual('<div class="test test2"></div>');
				DomHelper.removeClass(el, 'test2');
				expect(element.innerHTML).toEqual('<div class="test"></div>');
			});

		});

		describe('setAttributes', function () {

			it('should set attributes', function () {
				var el = DomHelper.newElement('div');
				DomHelper.setAttributes(el, {
					'class':'test',
					'data-test': 'test2'
				});
				expect(el.getAttribute('class')).toEqual('test');
				expect(el.getAttribute('data-test')).toEqual('test2');
			});

		});

	});

});