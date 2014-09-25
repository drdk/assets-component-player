define(['dr-media-gemius-implementation', 'dr-media-class'], function (GemiusImplementation, MediaClass) {

	var fakePlayer;
	var fakePlayerPosition;
	var gemiusImplementation;
	var options;

	function initPlayer(videoType) {
		fakePlayer = new MediaClass();
		options.videoData.videoType = videoType;
		fakePlayer.setOptions(options);
		fakePlayer.ensureLiveStreams = function (callback) {
			callback();
		};
		fakePlayer.ensureResource = function (callback) {
			callback();
		};
		fakePlayer.duration = function () {
			return 100;
		};
		fakePlayer.position = function () {
			return fakePlayerPosition;
		}
		fakePlayer.hasResource = function () {
			return true;
		};
		fakePlayer.productionNumber = function () {
			return '12345678901';
		};
		fakePlayer.resourceName = function () {
			return 'RESOURCE_NAME'
		}
		fakePlayerPosition = 50;
		gemiusImplementation = new GemiusImplementation(fakePlayer);
	}

	describe('GemiusImplementation', function () {

		
		beforeEach(function () {
			spyOn(gemiusStream, 'event');
			spyOn(gemiusStream, 'newStream');
			spyOn(gemiusStream, 'closeStream');

			options = {
				videoData: {
					materialIdentifier: 'MATERIAL_IDENTIFIER'
				},
				appData: {
					gemius: {
						channelName: 'CHANNEL_NAME',
						drIdentifier: 'DR_IDENTIFIER',
						hitcollector: 'COLLECTOR',
						identifier: 'IDENTIFIER',
						playerId: 'PLAYER_ID'
					}
				}
			};
		});

		afterEach(function () {
			fakePlayer = null;
			hashTimeCodeImplementation = null;
			document.location.hash = '';
		});

		describe('live', function () {

			it('should start a new gemius stream', function (done) {
				initPlayer('live');
				fakePlayer.addEvent('play', function () {
					expect(gemiusStream.newStream.calls.count()).toEqual(1);
					expect(gemiusStream.newStream).toHaveBeenCalledWith(
						fakePlayer.options.appData.gemius.playerId,
						'DR_IDENTIFIERMATERIAL_IDENTIFIER',
						-1,
						jasmine.any(Array),
						[],
						'IDENTIFIER',
						'COLLECTOR',
						[]);
					done();
				});
				fakePlayer.fireEvent('play');
			});

			it('should add channel id to custom package', function () {
				options.videoData.channelId = 'CHANNEL_ID';
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'PROGRAMME' && p.value == 'CHANNEL_ID') {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should match autoplay and autostart i custom package (false/NO)', function () {
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'AUTOSTART' && p.value == 'NO') {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should match autoplay and autostart i custom package (true/YES)', function () {
				options.appData.autoPlay = true;
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'AUTOSTART' && p.value == 'YES') {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should add document location to custom package', function () {
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'URL' && p.value == encodeURIComponent(document.location.pathname)) {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should add platform to custom package', function () {
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'PLATFORM') {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should add channel to custom package', function () {
				initPlayer('live');
				fakePlayer.fireEvent('play');
				var customPackage = gemiusStream.newStream.calls.mostRecent().args[3];
				var ok = false;
				for (var i = 0; i < customPackage.length; i++) {
					var p = customPackage[i];
					if (p.name == 'CHANNEL' && p.value == fakePlayer.options.appData.gemius.channelName) {
						ok = true;
					}
				}
				expect(ok).toEqual(true);
			});

			it('should send stopped event when player pauses', function (done) {
				initPlayer('live');
				fakePlayer.addEvent('pause', function () {
					expect(gemiusStream.event).toHaveBeenCalledWith(
						fakePlayer.options.appData.gemius.playerId,
						'DR_IDENTIFIERMATERIAL_IDENTIFIER',
						50,
						'stopped');
					done();
				});
				fakePlayer.fireEvent('pause');
			});

			it('should send buffer events', function () {
				initPlayer('live');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('buffering');
				fakePlayer.fireEvent('bufferingComplete');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'buffering');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event.calls.count()).toEqual(3);
			});
		});

		describe('ondemand', function () {


			it('should start a new gemius stream', function (done) {
				initPlayer('ondemand');
				fakePlayer.addEvent('play', function () {
					expect(gemiusStream.newStream.calls.count()).toEqual(1);
					expect(gemiusStream.newStream).toHaveBeenCalledWith(
						fakePlayer.options.appData.gemius.playerId,
						'DR_IDENTIFIERMATERIAL_IDENTIFIER',
						100,
						jasmine.any(Array),
						[],
						'IDENTIFIER',
						'COLLECTOR',
						[]);
					done();
				});
				fakePlayer.fireEvent('play');
			});

			it('should send paused event when player pauses', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('pause');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'paused');
				
			});

			it('should send seekingStarted event', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('beforeSeek');
				
				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'seekingStarted');
			});

			it('should send playing event after seeking if playing', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('beforeSeek');
				fakePlayerPosition = 70;
				fakePlayer.fireEvent('afterSeek');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'seekingStarted');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					70,
					'playing');

				expect(gemiusStream.event.calls.count()).toEqual(3);
			});

			it('should not send playing event after seeking if not playing', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('pause');
				fakePlayer.fireEvent('beforeSeek');
				fakePlayerPosition = 70;
				fakePlayer.fireEvent('afterSeek');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'paused');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'seekingStarted');

				expect(gemiusStream.event.calls.count()).toEqual(3);
			});

			it('should send buffer events', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('buffering');
				fakePlayer.fireEvent('bufferingComplete');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'buffering');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'playing');

				expect(gemiusStream.event.calls.count()).toEqual(3);
			});

			it('should call a complete and closeStream event when the player completes', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('complete');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50,
					'complete');

				expect(gemiusStream.closeStream).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					50);
			});

			it('should not send buffering or play gemius events after a complete event', function () {
				initPlayer('ondemand');
				fakePlayer.fireEvent('play');
				fakePlayerPosition = fakePlayer.duration();
				fakePlayer.fireEvent('complete');
				fakePlayer.fireEvent('play');
				fakePlayer.fireEvent('buffering');

				expect(gemiusStream.event).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					fakePlayer.duration(),
					'complete');

				expect(gemiusStream.closeStream).toHaveBeenCalledWith(
					fakePlayer.options.appData.gemius.playerId,
					'DR_IDENTIFIERMATERIAL_IDENTIFIER',
					fakePlayer.duration());

				expect(gemiusStream.event.calls.count()).toEqual(2);
				expect(gemiusStream.closeStream.calls.count()).toEqual(1);
			});

		});
		
	});
});