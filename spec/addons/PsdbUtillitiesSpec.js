define(['dr-media-psdb-utilities', 'dr-media-class', 'jasmine-ajax'], function (PsdbUtilities, MediaClass, jasmine) {

	describe('PsdbUtilities', function () {

		var fakePlayer;
		var psdbUtilities;

		beforeEach(function () {
			jasmine.Ajax.install();
			fakePlayer = new MediaClass();
			fakePlayer.setOptions({
				videoData: {
					trackviewurl: '/some/cool/url',
					episodeurn: 'URN-VALUE'
				}
			});
			psdbUtilities = new PsdbUtilities(fakePlayer);
		});

		afterEach(function () {
			jasmine.Ajax.uninstall();
			fakePlayer = null;
			psdbUtilities = null;
		});

		it('should make an ajax call when player starts', function () {
			fakePlayer.fireEvent('play');
			expect(jasmine.Ajax.requests.mostRecent().url).toBe('/some/cool/url');
			expect(jasmine.Ajax.requests.mostRecent().params).toBe('id=URN-VALUE');
		});

		it('should only make a call the first time the player fires a play event', function () {
			fakePlayer.fireEvent('play');
			expect(jasmine.Ajax.requests.count()).toEqual(1);
			fakePlayer.fireEvent('play');
			expect(jasmine.Ajax.requests.count()).toEqual(1);
		})

	});

});