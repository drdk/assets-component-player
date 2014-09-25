define(['audio-control-play-button', 'dr-media-class', 'dr-widget-media-dom-helper'], function (PlayButton, MediaClass, DomHelper) {
	

	describe('PlayButton', function () {
		var fakePlayer;
		var playButton;

		beforeEach(function () {
			fakePlayer = new MediaClass();
			fakePlayer.play = function () {};
			fakePlayer.pause = function () {};
			playButton = new PlayButton(fakePlayer, 'play-class', 'pause-class');

			spyOn(fakePlayer, 'pause');
			spyOn(fakePlayer, 'play');
		});

		afterEach(function () {
			fakePlayer = null;
			playButton = null;
		});

		

		it('should tell player to play when clicked', function () {
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.play).toHaveBeenCalled();
		});

		it('should change state when player pauses', function () {
			fakePlayer.fireEvent('pause');
			expect(DomHelper.hasClass(playButton, 'play-class')).toEqual(true);
		});

		it('should change state when player plays', function () {
			fakePlayer.fireEvent('play');
			expect(DomHelper.hasClass(playButton, 'pause-class')).toEqual(true);
		});

		it('should tell player to pause when clicked', function () {
			fakePlayer.fireEvent('play');
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.pause).toHaveBeenCalled();
		});

		it('should disable button when clicked until it receives play event', function () {
			DomHelper.trigger(playButton, 'click');
			expect(DomHelper.hasClass(playButton, 'disabled')).toEqual(true);
			expect(fakePlayer.play).toHaveBeenCalled();
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.pause).not.toHaveBeenCalled();
			fakePlayer.fireEvent('play');
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.pause).toHaveBeenCalled();
		});

		it('should disable button when clicked until it receives pause event', function () {
			fakePlayer.fireEvent('play');
			DomHelper.trigger(playButton, 'click');
			expect(DomHelper.hasClass(playButton, 'disabled')).toEqual(true);
			expect(fakePlayer.pause).toHaveBeenCalled();
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.play).not.toHaveBeenCalled();
			fakePlayer.fireEvent('pause');
			DomHelper.trigger(playButton, 'click');
			expect(fakePlayer.play).toHaveBeenCalled();
		});

	});

});