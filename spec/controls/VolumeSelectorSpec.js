define(['audio-control-volumeselector', 'dr-media-class', 'dr-widget-media-dom-helper'], function (VolumeSelector, MediaClass, DomHelper) {
	

	describe('VolumeSelector', function () {

		var fakePlayer;
		var volumeSelector;

		beforeEach(function () {

			jasmine.clock().install();

			if ('localStorage' in window && window.localStorage !== null) {
				localStorage['dr:netradio:volume'] = '0.5';
			}

			fakePlayer = new MediaClass();
			fakePlayer.volume = function () {};
			fakePlayer.setVolume = function () {};
			volumeSelector = new VolumeSelector(fakePlayer);

			spyOn(fakePlayer, 'volume');
			spyOn(fakePlayer, 'setVolume');
		});

		afterEach(function () {
			jasmine.clock().uninstall();
			fakePlayer = null;
			volumeSelector = null;
		});

		
		it('should load inital volume', function () {
			jasmine.clock().tick(1);
			expect(fakePlayer.setVolume).toHaveBeenCalledWith(0.5);
		});

		it('should add a mute css class if player is muted', function () {
			fakePlayer.volume = function () { return 0; };
			fakePlayer.fireEvent('volumechange');
			expect(DomHelper.hasClass(volumeSelector, 'muted')).toEqual(true);
		});

		it('should call player.setVolume when clicked', function () {
			DomHelper.trigger(volumeSelector.lastChild, 'click');
			jasmine.clock().tick(1);
			expect(fakePlayer.setVolume).toHaveBeenCalled();
		});

		if ('localStorage' in window && window.localStorage !== null) {
			it('should save volume to local storage when changed', function () {
				fakePlayer.volume = function () { return 0.6; };
				DomHelper.trigger(volumeSelector.lastChild, 'click');
				jasmine.clock().tick(1);
				expect(Number(localStorage['dr:netradio:volume'])).toEqual(0.6);
			});
		}

	});

});


