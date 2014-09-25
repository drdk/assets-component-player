define(['dr-media-player-factory', 'jasmine-ajax'], function (PlayerFactory, jasmine) {

	describe('GemiusImplementation', function () {

		describe('video', function () {

			describe('ondemand', function () {

				var player;

				beforeEach(function () {

					spyOn(gemiusStream, 'event');
					spyOn(gemiusStream, 'newStream');
					spyOn(gemiusStream, 'closeStream');

					window.player = player = PlayerFactory.getPlayer({
						'element': document.getElementById('test-player'),
						'videoData': {
							'broadCastDate': '2014-09-17T18:00:00Z',
							'durationInMilliseconds': 3463960,
							'episodeSlug': 'den-store-bagedyst-4-8-2',
							'materialIdentifier': 'den-store-bagedyst-4-8-2',
							'productionNumber': '00951411040',
							'programSerieSlug': 'den-store-bagedyst',
							'programmeName': 'Den Store Bagedyst (4:8)',
							'resource': 'http://www.dr.dk/mu/programcard/expanded/den-store-bagedyst-4-8-2',
							'urnId': 'urn:dr:mu:programcard:540e3bf76187a2165c204ca1',
							'videoType': 'ondemand'
						},
						'appData': {
							'autoPlay': true,
							'gemius': {
								'channelName': 'TV',
								'drIdentifier': '019_drdk-',
								'hitcollector': 'http://sdk.hit.gemius.pl',
								'identifier': 'p9AwR.N.S86s_NjaJKdww7b.fdp8ky90ZnrKpgLHOUn.s7',
								'playerId': 'global-assets-player_900129'
							}
						},
						'enableHashTimeCode': false,
						'type': 'video'
					});

					originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

				});

				afterEach(function() {
					player.options.element.innerHTML = "";
					player = null;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				});

				it('should initialize new gemius stream', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.newStream.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send play event', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'playing');
						expect(gemiusStream.event.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send paused event', function (done) {
					player.addEvent('pause', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'paused');
						// expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						// expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('paused');
						done();
					});
					player.addEvent('play', function () {
						player.pause();
					});
				});

				it('should send seekingStarted event', function (done) {
					player.addEvent('beforeSeek', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							0,
							'seekingStarted');
						// expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						// expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('seekingStarted');
						done();
					});
					player.addEvent('play', function () {
						player.seek('20:00');
					});
				});

				it('should send playing event after seeking', function (done) {
					player.addEvent('afterSeek', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							1200,
							'playing');
						// expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						// expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('seekingStarted');
						// expect(gemiusStream.event.calls.argsFor(2)[3]).toEqual('playing');
						done();
					});
					player.addEvent('play', function () {
						player.seek('20:00');
					});
				});

				it('should send complete event and close stream after playback', function (done) {
					player.addEvent('complete', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'complete');
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					function p() {
						player.seek('57:00');
						// player.removeEvent('play', p); //remove event handler or cause infinite seek loop
					}
					player.addEvent('durationChange', p);
				});

				it('should stop gemius stream if content is cleared', function (done) {
					player.addEvent('clearContent', function () {
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					player.addEvent('play', function () {
						player.clearContent();
					});
				});

			});

			describe('live', function () {

				var player;

				beforeEach(function () {

					spyOn(gemiusStream, 'event');
					spyOn(gemiusStream, 'newStream');
					spyOn(gemiusStream, 'closeStream');

					window.player = player = PlayerFactory.getPlayer({
						'element': document.getElementById('test-player'),
						'videoData': {
							'videoType': 'live',
							'channelId': 'dr1',
							'materialIdentifier': 'dr1'
						},
						'appData': {
							'autoPlay': true,
							'gemius': {
								'channelName': 'TV',
								'drIdentifier': '019_drdk-',
								'hitcollector': 'http://sdk.hit.gemius.pl',
								'identifier': 'p9AwR.N.S86s_NjaJKdww7b.fdp8ky90ZnrKpgLHOUn.s7',
								'playerId': 'global-assets-player_493696'
							}
						},
						'enableHashTimeCode': false,
						'type': 'video'
					});

					originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
				});

				afterEach(function() {
					player.options.element.innerHTML = "";
					player = null;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				});

				it('should initialize new gemius stream', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.newStream.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send play event', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'playing');
						expect(gemiusStream.event.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send stopped event', function (done) {
					player.addEvent('pause', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'stopped');
						expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('stopped');
						done();
					});
					player.addEvent('play', function () {
						player.stop();
					});
				});

				it('should stop gemius stream if content is cleared', function (done) {
					player.addEvent('clearContent', function () {
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					player.addEvent('play', function () {
						player.clearContent();
					});
				});

			});

		});


		describe('audio', function () {

			describe('ondemand', function () {

				var player;

				beforeEach(function () {

					spyOn(gemiusStream, 'event');
					spyOn(gemiusStream, 'newStream');
					spyOn(gemiusStream, 'closeStream');

					window.player = player = PlayerFactory.getPlayer({
						'element': document.getElementById('test-player'),
						'videoData': {
							'episodeurn':'urn%3adr%3amu%3aprogramcard%3a5410e5516187a21370ac68dc',
							'resource': 'http://www.dr.dk/mu/programcard/expanded/p1-morgen-819',
							'videoType': 'ondemand',
							'channelId': null
						},
						'appData': {
							'autoPlay': true,
							'gemius': {
								'channelName': 'drdk'
							}
						},
						'enableHashTimeCode': false,
						'type': 'audio',
						'swfUrl': 'lib/DRInvisibleAudioPlayer.swf'
					});

					originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
				});

				afterEach(function() {
					player.options.element.innerHTML = "";
					player = null;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				});

				it('should initialize new gemius stream', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.newStream.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send play event', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'playing');
						expect(gemiusStream.event.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send paused event', function (done) {
					player.addEvent('pause', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'paused');
						expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('paused');
						done();
					});
					player.addEvent('play', function () {
						player.pause();
					});
				});

				it('should send seekingStarted event', function (done) {
					player.addEvent('beforeSeek', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							0,
							'seekingStarted');
						expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('seekingStarted');
						done();
					});
					player.addEvent('play', function () {
						player.seek('20:00');
					});
				});

				it('should send playing event after seeking', function (done) {
					player.addEvent('afterSeek', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							1200,
							'playing');
						expect(gemiusStream.event.calls.argsFor(0)[3]).toEqual('playing');
						expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('seekingStarted');
						expect(gemiusStream.event.calls.argsFor(2)[3]).toEqual('playing');
						done();
					});
					player.addEvent('play', function () {
						player.seek('20:00');
					});
				});

				it('should send complete event and close stream after playback', function (done) {
					player.addEvent('complete', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'complete');
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					function p() {
						player.seek('2:54:58');
						player.removeEvent('play', p); //remove event handler or cause infinite seek loop
					}
					player.addEvent('play', p);
				});

				it('should stop gemius stream if content is cleared', function (done) {
					player.addEvent('clearContent', function () {
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					player.addEvent('play', function () {
						player.clearContent();
					});
				});
			});

			describe('live', function () {

				var player;

				beforeEach(function() {
					
					// mock json request:
					// jasmine.Ajax.install();
					// jasmine.Ajax.stubRequest('/mu-online/api/1.0/channel/all-active-dr-radio-channels').andReturn({
					// 	'responseText': '[{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel3_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel3_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A03H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A03L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A03H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A03L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p1_9@143503","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p1_9@143503","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A03H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A03L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P1","SourceUrl":"dr.dk/mas/whatson/channel/P1D","WebChannel":false,"Slug":"p1","Urn":"urn:dr:mu:bundle:4f3b8918860d9a33ccfdaf4d","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71849a11f9d162028cfe7","Title":"DR P1","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel4_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel4_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A04H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A04L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A04H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A04L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/p2_9@143504","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":256,"Streams":[{"Stream":"manifest.f4m?b=100-500"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/p2_9@143504","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":256,"Streams":[{"Stream":"master.m3u8?b=100-500"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A04H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A04L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P2","SourceUrl":"dr.dk/mas/whatson/channel/P2D","WebChannel":false,"Slug":"p2","Urn":"urn:dr:mu:bundle:4f3b8919860d9a33ccfdaf54","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71865a11f9d162028cfea","Title":"DR P2","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel5_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel5_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A05H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A05L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A05H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A05L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p3_9@143506","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p3_9@143506","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A05H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A05L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P3","SourceUrl":"dr.dk/mas/whatson/channel/P3","WebChannel":false,"Slug":"p3","Urn":"urn:dr:mu:bundle:4f3b891b860d9a33ccfdaf74","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b7188aa11f9d162028cfed","Title":"P3","Subtitle":"Det man hører er man selv."},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel8_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel8_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A08H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A08L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A08H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A08L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p4kobenhavn_9@143509","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p4kobenhavn_9@143509","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A08H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A08L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/kbh","SourceUrl":"dr.dk/mas/whatson/channel/KH4","WebChannel":false,"Slug":"p4kbh","Urn":"urn:dr:mu:bundle:4f3b890a860d9a33ccfdaf39","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71aef6187a2122496208a","Title":"P4 København","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel6_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel6_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A06H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A06H.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A06H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A06L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p4bornholm_9@143507","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p4bornholm_9@143507","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A06H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A06L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/bornholm","SourceUrl":"dr.dk/mas/whatson/channel/RØ4","WebChannel":false,"Slug":"p4bornholm","Urn":"urn:dr:mu:bundle:4f3b892b860d9a33ccfdafd2","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71a58a11f9d162028d003","Title":"P4 Bornholm","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel15_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel15_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A15H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A15L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A15H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A15L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p4esbjerg_9@143516","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p4esbjerg_9@143516","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A15H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A15L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/esbjerg","SourceUrl":"dr.dk/mas/whatson/channel/ES4","WebChannel":false,"Slug":"p4esbjerg","Urn":"urn:dr:mu:bundle:4f3b88fe860d9a33ccfdaf06","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71a836187a21224962082","Title":"P4 Esbjerg","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel7_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel7_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A07H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A07L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A07H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A07L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/p4fyn_9@143508","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/p4fyn_9@143508","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A07H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A07L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/fyn","SourceUrl":"dr.dk/mas/whatson/channel/OD4","WebChannel":false,"Slug":"p4fyn","Urn":"urn:dr:mu:bundle:4f3b8911860d9a33ccfdaf41","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71aca6187a21224962085","Title":"P4 Fyn","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel9_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel9_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A09H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A09L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A09H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A09L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p4midtvest_9@143510","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p4midtvest_9@143510","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A09H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A09L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/vest","SourceUrl":"dr.dk/mas/whatson/channel/HO4","WebChannel":false,"Slug":"p4vest","Urn":"urn:dr:mu:bundle:4f3b8907860d9a33ccfdaf34","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71b0d6187a2122496208d","Title":"P4 Midt & Vest","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel10_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel10_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A10H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"/A10L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A10H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A10L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/p4nordjylland_9@143511","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/p4nordjylland_9@143511","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A10H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A10H.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/nord","SourceUrl":"dr.dk/mas/whatson/channel/ÅL4","WebChannel":false,"Slug":"p4nord","Urn":"urn:dr:mu:bundle:4f3b8937860d9a33ccfdafdc","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71b336187a21224962090","Title":"P4 Nordjylland","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel11_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel11_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A11H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A11L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A11H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A11L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p4sjaelland_9@143512","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p4sjaelland_9@143512","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A11H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A11L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/sjaelland","SourceUrl":"dr.dk/mas/whatson/channel/NV4","WebChannel":false,"Slug":"p4sjaelland","Urn":"urn:dr:mu:bundle:4f3b890d860d9a33ccfdaf3e","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71b766187a21224962096","Title":"P4 Sjælland","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel12_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel12_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A12H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A12L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A12H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A12L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p4syd_9@143513","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p4syd_9@143513","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A12H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A12L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/syd","SourceUrl":"dr.dk/mas/whatson/channel/ÅB4","WebChannel":false,"Slug":"p4syd","Urn":"urn:dr:mu:bundle:4f3b8934860d9a33ccfdafd9","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71b946187a21224962099","Title":"P4 Syd","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel13_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel13_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A13H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A13L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A13H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A13L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/p4trekanten_9@143514","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/p4trekanten_9@143514","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A13H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A13L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/trekanten","SourceUrl":"dr.dk/mas/whatson/channel/TR4","WebChannel":false,"Slug":"p4trekanten","Urn":"urn:dr:mu:bundle:4f3b892f860d9a33ccfdafd7","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71bbe6187a2122496209c","Title":"P4 Trekanten","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel14_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel14_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A14H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A14L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A14H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A14L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p4ostjylland_9@143515","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p4ostjylland_9@143515","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A14H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A14H.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P4/aarhus","SourceUrl":"dr.dk/mas/whatson/channel/ÅR4","WebChannel":false,"Slug":"p4aarhus","Urn":"urn:dr:mu:bundle:4f3b893a860d9a33ccfdafdf","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/bar/52a5a0f9a11f9d1740bccd2c","Title":"P4 Østjylland","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel25_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel25_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A25H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A25L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A25H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A25L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p5_9@143530","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p5_9@143530","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A25H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A25L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P5","SourceUrl":"dr.dk/mas/whatson/channel/P5D","WebChannel":false,"Slug":"p5","Urn":"urn:dr:mu:bundle:4f3b8922860d9a33ccfdaf96","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b718d0a11f9d162028cff0","Title":"DR P5","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel29_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel29_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A29H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A29L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A29H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A29L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p6beat_9@143533","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p6beat_9@143533","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/p6beat_0@143533","LinkType":"HDS_udgået","Qualities":[{"Kbps":192,"Streams":[{"Stream":"manifest.f4m"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/p6beat_0@143533","LinkType":"HLS_udgået","Qualities":[{"Kbps":192,"Streams":[{"Stream":"http://drradio3-lh.akamaihd.net/i/p6beat_0@143533"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A29H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A29L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P6BEAT","SourceUrl":"dr.dk/mas/whatson/channel/P6B","WebChannel":false,"Slug":"p6beat","Urn":"urn:dr:mu:bundle:4f3b8922860d9a33ccfdaf9f","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b718f1a11f9d162028cff3","Title":"DR P6 BEAT","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel21_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel21_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A21H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"/A21L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A21H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A21L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/z/p7mix_9@143522","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio1-lh.akamaihd.net/i/p7mix_9@143522","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A21H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A21L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P7MIX","SourceUrl":"dr.dk/mas/whatson/channel/P7M","WebChannel":false,"Slug":"p7mix","Urn":"urn:dr:mu:bundle:4f3b8924860d9a33ccfdafa9","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b71912a11f9d162028cff6","Title":"DR P7 MIX","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel22_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel22_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A22H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A22L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A22H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A22L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/p8jazz_9@143524","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/p8jazz_9@143524","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A22H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A22L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/P8JAZZ","SourceUrl":"dr.dk/mas/whatson/channel/P8J","WebChannel":false,"Slug":"p8jazz","Urn":"urn:dr:mu:bundle:4f3b8926860d9a33ccfdafb9","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b7192ca11f9d162028cff9","Title":"DR P8 JAZZ","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel18_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel18_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A18H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A18L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A18H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A18L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/drmama_9@143520","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/drmama_9@143520","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A18H.mp3"}]},{"Kbps":0,"Streams":[{"Stream":"A18L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/MAMA","SourceUrl":"dr.dk/mas/whatson/channel/DRM","WebChannel":false,"Slug":"mama","Urn":"urn:dr:mu:bundle:4f3b88f8860d9a33ccfdaeca","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51b9b62ca11f9d0b18fca764","Title":"DR MAMA","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel24_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel24_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A24H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A24L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A24H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A24L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/z/ramasjang_9@143529","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio3-lh.akamaihd.net/i/ramasjang_9@143529","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A24H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A24L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk/ramasjang","SourceUrl":"dr.dk/mas/whatson/channel/RAM","WebChannel":false,"Slug":"ramasjangradio","Urn":"urn:dr:mu:bundle:4f3b8928860d9a33ccfdafcc","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/Bar/51dd4338a11f9d104ce97392","Title":"DR Ramasjang/Ultra Radio","Subtitle":""},{"Type":"Channel","StreamingServers":[{"Server":"rtmp://live.gss.dr.dk/live","LinkType":"Streaming","Qualities":[{"Kbps":192,"Streams":[{"Stream":"Channel2_HQ"}]},{"Kbps":48,"Streams":[{"Stream":"Channel2_LQ"}]}],"DynamicUserQualityChange":false},{"Server":"http://ahls.gss.dr.dk/A","LinkType":"Ios","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A02H.stream/Playlist.m3u8"}]},{"Kbps":96,"Streams":[{"Stream":"A02L.stream/Playlist.m3u8"}]}],"DynamicUserQualityChange":false},{"Server":"rtsp://artsp.gss.dr.dk/A","LinkType":"Android","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A02H.stream"}]},{"Kbps":96,"Streams":[{"Stream":"A02L.stream"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/z/drnyheder_9@143532","LinkType":"HDS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"manifest.f4m"}]},{"Kbps":64,"Streams":[{"Stream":"manifest.f4m?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"manifest.f4m?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://drradio2-lh.akamaihd.net/i/drnyheder_9@143532","LinkType":"HLS","Qualities":[{"Kbps":-1,"Streams":[{"Stream":"master.m3u8"}]},{"Kbps":64,"Streams":[{"Stream":"master.m3u8?b=1-99"}]},{"Kbps":192,"Streams":[{"Stream":"master.m3u8?b=100-240"}]}],"DynamicUserQualityChange":false},{"Server":"http://live-icy.gss.dr.dk/A","LinkType":"ICY","Qualities":[{"Kbps":192,"Streams":[{"Stream":"A02H.mp3"}]},{"Kbps":96,"Streams":[{"Stream":"A02L.mp3"}]}],"DynamicUserQualityChange":false}],"Url":"http://www.dr.dk","SourceUrl":"dr.dk/mas/whatson/channel/DRN","WebChannel":false,"Slug":"nyhederradio","Urn":"urn:dr:mu:bundle:4f3b88fb860d9a33ccfdaee5","PrimaryImageUri":"http://www.dr.dk/mu-online/api/1.0/bar/helper/get-image-for-channel/nyhederradio","Title":"DR Nyheder","Subtitle":""}]'
					// });

					spyOn(gemiusStream, 'event');
					spyOn(gemiusStream, 'newStream');
					spyOn(gemiusStream, 'closeStream');

					window.player = player = PlayerFactory.getPlayer({
						'element': document.getElementById('test-player'),
						'videoData': {
							'videoType': 'live',
							'resource': null,
							'channelId': 'p1'
						},
						'appData': {
							'autoPlay': true,
							'gemius': {
								'channelName': 'p1'
							}
						},
						'enableHashTimeCode': false,
						'type': 'audio',
						'swfUrl': 'lib/DRInvisibleAudioPlayer.swf'
					});

					originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
				});

				afterEach(function() {
					player.options.element.innerHTML = "";
					player = null;
					jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
				});

				it('should initialize new gemius stream', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.newStream.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send play event', function (done) {
					player.addEvent('play', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'playing');
						expect(gemiusStream.event.calls.count()).toEqual(1);
						done();
					});
				});

				it('should send stopped event', function (done) {
					player.addEvent('pause', function () {
						expect(gemiusStream.event).toHaveBeenCalledWith(
							player.options.appData.gemius.playerId,
							player.options.appData.gemius.drIdentifier + player.options.videoData.materialIdentifier,
							jasmine.any(Number),
							'stopped');
						expect(gemiusStream.event.calls.argsFor(1)[3]).toEqual('stopped');
						done();
					});
					player.addEvent('play', function () {
						player.pause();
					});
				});

				it('should stop gemius stream if content is cleared', function (done) {
					player.addEvent('clearContent', function () {
						expect(gemiusStream.closeStream).toHaveBeenCalled();
						done();
					});
					player.addEvent('play', function () {
						player.clearContent();
					});
				});

			});
		});
	});
});