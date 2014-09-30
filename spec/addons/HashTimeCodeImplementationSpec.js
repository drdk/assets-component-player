define(['dr-media-hash-implementation', 'dr-media-class'], function (HashTimeCodeImplementation, MediaClass) {


	describe('HashTimeCodeImplementation', function () {

		var fakePlayer;
		var hashTimeCodeImplementation;

		beforeEach(function () {
			fakePlayer = new MediaClass();
			fakePlayer.setOptions({
				videoData: {
					startTimeCode: null
				},
				appData: {}
			});
			fakePlayer.currentTimeCode = function (){
				return "10:00";
			};
			fakePlayer.seek = function () {};
			fakePlayer.play = function () {};
			fakePlayer.build = function () {};

			spyOn(fakePlayer, 'seek');
			spyOn(fakePlayer, 'play');
			spyOn(fakePlayer, 'build');

			hashTimeCodeImplementation = new HashTimeCodeImplementation(fakePlayer);
		});

		afterEach(function () {
			fakePlayer = null;
			hashTimeCodeImplementation = null;
			document.location.hash = '';
		});

		it('should set browsers location hash, when player pauses', function () {
			fakePlayer.fireEvent('pause');
			expect(document.location.hash).toEqual('#!/10:00');
		});

		it('should call seek and play on player when location hash changes', function (done) {
			function hashchangeHandler() {
				expect(fakePlayer.seek).toHaveBeenCalledWith('20:00');
				expect(fakePlayer.play).toHaveBeenCalled();
				if ('removeEventListener' in window) {
					window.removeEventListener('hashchange', hashchangeHandler);
				} else {
					window.detachEvent('onhashchange', hashchangeHandler);
				}
				done();
			}
			if ('addEventListener' in window) {
				window.addEventListener('hashchange', hashchangeHandler);
			} else {
				window.attachEvent('onhashchange', hashchangeHandler);
			}
			document.location.hash = '#!/20:00';
		});

		it('should seek player if a timecode is defined in player options', function () {
			fakePlayer.options.videoData.startTimeCode = '12:12';
			hashTimeCodeImplementation = new HashTimeCodeImplementation(fakePlayer);
			expect(fakePlayer.seek).toHaveBeenCalledWith('12:12');
		});

		it('should seek player if a timecode is present in location hash, before the player is contructed (deep link)', function () {
			document.location.hash = '#!/12:34';
			hashTimeCodeImplementation = new HashTimeCodeImplementation(fakePlayer);
			expect(fakePlayer.seek).toHaveBeenCalledWith('12:34');
		});

		it('should set player autoPlay option if parameter exists in location hash', function () {
			document.location.hash = '#!/12:34,autoplay=true';
			hashTimeCodeImplementation = new HashTimeCodeImplementation(fakePlayer);
			expect(fakePlayer.options.appData.autoPlay).toEqual(true);
		});

		it('should set player assetType option if parameter exists in location hash', function () {
			document.location.hash = '#!/12:34,assetType=PEWPEW';
			hashTimeCodeImplementation = new HashTimeCodeImplementation(fakePlayer);
			expect(fakePlayer.options.appData.assetType).toEqual('PEWPEW');
		});

	});



});