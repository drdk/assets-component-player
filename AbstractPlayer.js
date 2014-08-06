/* jshint devel: true */
/* global define: true, escape: true */

define('dr-media-abstract-player', ['dr-media-class'], function (MediaClass) {
    'use strict';

    var AbstractPlayer = function(options) {
        MediaClass.call(this);
        this.resourceResult = null;
        this.programcardResult = null;
        this.assetsLinksResult = null;
        this.hasDuration = null;
        this.hashTimeCodeInstance = null;
        this._forceSeekIntervalId = null;
        this._forceSeekTries = 0;

        this.setOptions({
            appData: {
                gemius: {
                    drIdentifier: '019_drdk-',
                    identifier: 'p9AwR.N.S86s_NjaJKdww7b.fdp8ky90ZnrKpgLHOUn.s7',
                    hitcollector: 'http://sdk.hit.gemius.pl',
                    channelName: 'drdk'
                },
                urls: {
                    geoHandlerUrl: '/DR/DR.CheckIP.IsDanish/'
                },
                linkType: 'Streaming',
                fileType: 'mp3',
                assetType: 'default'
            },
            videoData: {
                materialIdentifier: 'unknown'
            },
            enableHashTimeCode: false
        });

        if (options) {
            this.setOptions(options);
        }

        // legacy support: 
        // 'dr-ui-media-playlist' requires a player instance stored on element and an instance event
        // check for mootools methods in element
        if (this.options.element) {
            if ('store' in this.options.element) {
                this.options.element.store('instance', this);
            }
            if ('fireEvent' in this.options.element) {
                this.options.element.fireEvent('instance', this);
            }
        }

        this.mediaPlayerId = ++AbstractPlayer.$mediaPlayerId;

        window.DR = window.DR || {};
        window.DR.TV = window.DR.TV || {};
        window.DR.TV.playerInstance = this;
    };
    MediaClass.inheritance(AbstractPlayer, MediaClass);

    // static:
    AbstractPlayer.$mediaPlayerId = 0;
 
    // public methods:

    AbstractPlayer.prototype.ensureResource = function (resourceReady, scope) {
        if (this.hasResource()) {
            if (scope) {
                resourceReady.call(scope);
            } else {
                resourceReady();
            }
        } else {
            var url = this.options.videoData.resource;
            this.fireEvent('resourceLoading');
            if (this.options.platform) {
                if (url.indexOf('?') !== -1) {
                    url = url + '&type=' + this.options.platform;
                } else {
                    url = url + '?type=' + this.options.platform;
                }
            }
            //debug replace:
            if (document.location.host != 'www.dr.dk') {
                url = url.replace('www.dr.dk', document.location.host);
            }
            this.json(url, function(result){
                if (result.Data) {
                    this.programcardResult = result.Data[0];
                } else if (result.Links) {
                    this.assetsLinksResult = result.Links;
                } else {
                    this.resourceResult = result;
                }
                this.onDurationChange();
                if (scope) {
                    resourceReady.call(scope);
                } else {
                    resourceReady();
                }
                this.fireEvent('resourceReady');
            }, function (status) {
                this.displayError('defaultMsg', 'State: ' + status + ' ' + url);
                // console.log(status);
            }, this);
        }
    };
    AbstractPlayer.prototype.ensureLiveStreams = function (liveStreamsReady, scope) {
        if (this.options.videoData.channels) {
            if (scope) {
                liveStreamsReady.call(scope);
            } else {
                liveStreamsReady();
            }
        } else {
            var url = this.options.appData.urls.liveStreams;
            this.fireEvent('resourceLoading');
            this.json(url, function (result) {
                this.options.videoData.channels = [];
                for (var i=0; i<result.length; i++) {

                    var c = result[i];
                    if (c.StreamingServers) {
                        var logo = '';
                        if (c.SourceUrl && this.options.appData.urls.channelLogoUrl) {
                            var m = c.SourceUrl.match(/\/(\w{3})\/?$/i);
                            if (m) {
                                logo = m[1].toLowerCase();
                                logo = logo === 'tvu' ? 'drn' : logo;
                                logo = this.options.appData.urls.channelLogoUrl.replace('{id}', logo);
                            }
                        }
                        var channel = {
                            'name': c.Title,
                            'slug': c.Slug,
                            'url': c.Url,
                            'logo': logo,
                            'servers': [],
                            'webChannel': c.WebChannel === true
                        };
                        for (var j = 0; j < c.StreamingServers.length; j++) {
                            var s = c.StreamingServers[j];
                            var server = {
                                'server': s.Server,
                                'qualities': [],
                                'linkType': s.LinkType,
                                'dynamicUserQualityChange': s.DynamicUserQualityChange || false
                            };
                            for (var k = 0; k < s.Qualities.length; k++) {
                                var q = s.Qualities[k];
                                var quality = {
                                    'kbps': q.Kbps,
                                    'streams': []
                                };
                                for (var l = 0; l < q.Streams.length; l++) {
                                    var st = q.Streams[l];
                                    quality.streams.push(st.Stream);
                                }
                                server.qualities.push(quality);
                            }
                            channel.servers.push(server);
                        }
                        this.options.videoData.channels.push(channel);
                    }
                }
                if (scope) {
                    liveStreamsReady.call(scope);
                } else {
                    liveStreamsReady();
                }
                this.fireEvent('resourceReady');
            }, function (status) {
                console.error('error loading live streams ' + status + ' ' + url);
            }, this);
        }
    };
    AbstractPlayer.prototype.findClosestQuality = function (streams, kbps, linkType) {
        var i, stream, selecedStream, type, HLSStream, HDSStream;
        type = linkType || this.options.appData.linkType;
        for (i = 0; i < streams.length; i = i + 1) {
            stream = streams[i];
            if ( stream.linkType && stream.linkType.toLowerCase() === 'hls') {
                HLSStream = stream;
            }
            if ( stream.linkType && stream.linkType.toLowerCase() === 'hds') {
                HDSStream = stream;
            }
        }
        selecedStream = this.selectStream(streams, kbps, type);
        if ( (type.toLowerCase() === 'ios' || type.toLowerCase() === 'android') && HLSStream ) {
            selecedStream = HLSStream;
        } else if ( (type.toLowerCase() === 'streaming' ) && HDSStream ) {
            selecedStream = HDSStream;
        }
        if (!selecedStream) {
            selecedStream = this.selectStream(streams, kbps, 'download');
        }
        if (!selecedStream) {
            console.log('Unable to find stream ' + type + ' ' + this.options.appData.fileType);
            throw new Error('Unable to find stream ' + type + ' ' + this.options.appData.fileType);
        }
        return selecedStream;
    };
    AbstractPlayer.prototype.selectStream = function(streams, kbps, type) {
        var stream, currentKbps, currentDist, returnStream;
        var dist = -1;
        for (var i = 0; i < streams.length; i = i + 1) {
            stream = streams[i];
            if ((!stream.linkType || stream.linkType.toLowerCase() === type.toLowerCase()) && (!stream.fileType || stream.fileType == this.options.appData.fileType)) {
                currentKbps = (stream.kbps ? stream.kbps : stream.bitrateKbps);
                currentDist = Math.abs(currentKbps - kbps);
                if (dist === -1 || currentDist < dist) {
                    dist = currentDist;
                    returnStream = stream;
                }
            }
        }
        return returnStream;
    };
    AbstractPlayer.prototype.getQuerystring = function (key, default_) {
        if (default_===null) default_='';
        key = key.replace(/[\[]/,'\\\[').replace(/[\]]/,'\\\]');
        var regex = new RegExp('[\\?&]'+key+'=([^&#]*)');
        var qs = regex.exec(window.location.href);
        if(qs === null) {
            return default_;
        } else {
            return qs[1];
        }
    };
    AbstractPlayer.prototype.buildPreview = function () {};
    AbstractPlayer.prototype.play = function () { };
    AbstractPlayer.prototype.pause = function () { };
    AbstractPlayer.prototype.stop = function () { };
    AbstractPlayer.prototype.progress = function () {
        return this.position() / this.duration();
    };
    AbstractPlayer.prototype.position = function () {
        return 0;
    };
    AbstractPlayer.prototype.currentTimeCode = function () {
        return this.timeCodeConverter.secondsToTimeCode(this.position());
    };
    AbstractPlayer.prototype.duration = function () {
        if (this.resourceResult) {
            return this.resourceResult.durationInMilliseconds / 1000;
        }

        if (this.assetsLinksResult) {
            return this.options.videoData.durationInMilliseconds / 1000;
        }

        var mediaAsset = this.getMediaAsset();
        if (mediaAsset) {
            return mediaAsset.DurationInMilliseconds / 1000;
        }

        return 0;
    };
    AbstractPlayer.prototype.productionNumber = function () {
        if (this.resourceResult) {
            return this.resourceResult.productionNumber;
        } else if (this.assetsLinksResult) {
            return this.options.videoData.productionNumber;
        } else if (this.programcardResult && this.programcardResult.ProductionNumber) {
            return this.programcardResult.ProductionNumber;
        } else if (this.options.videoData.productionNumber) {
            return this.options.videoData.productionNumber;
        } else {
            return '00000000000';
        }
    };
    AbstractPlayer.prototype.resourceSlug = function () {
        // create slug for old getResource handler
        if (this.programcardResult) {
            return this.programcardResult.Slug;
        } else if (this.resourceResult && this.resourceResult.name) {
            var slug = this.resourceResult.name.toLowerCase();
            slug = slug.replace(/[^\-a-zA-Z0-9,&\s]+/ig, '');
            slug = slug.replace(/[\s|\-|\_]+/gi, '-');
            return slug.substr(0, 40);
        } else if (this.options.videoData.episodeSlug) {
            return this.options.videoData.episodeSlug;
        } else if (this.productionNumber() !== '00000000000') {
            return this.productionNumber();
        } else if (this.resourceResult && this.resourceResult.resourceId) {
            return 'resourceId:' + this.resourceResult.resourceId;
        } else {
            return '';
        }
    };
    AbstractPlayer.prototype.hasResource = function () {
        return (this.resourceResult !== null || this.programcardResult !== null || this.assetsLinksResult !== null);
    };
    AbstractPlayer.prototype.links = function () {
        if (this.resourceResult) {
            return this.resourceResult.links;
        }

        if (this.assetsLinksResult) {
            var result = [];
            for (var j = 0; j < this.assetsLinksResult.Links.length; j++) {
                var link = this.assetsLinksResult.Links[j];
                result.push({
                    uri: link.Uri,
                    linkType: link.Target,
                    fileType: link.FileFormat,
                    bitrateKbps: link.Bitrate,
                    width: link.Width,
                    height: link.Height
                });
            }
            return result;

        }

        var mediaAsset = this.getMediaAsset();

        if (mediaAsset && this.mapLinks(mediaAsset) && this.mapLinks(mediaAsset).length > 0) {
            return this.mapLinks(mediaAsset);
        }
        
        return [];
    };
    AbstractPlayer.prototype.getPosterImage = function () {
        // use custom image, if defined
        if (this.options.videoData.image) {
            return this.options.videoData.image;
        }
        // use image from resource and resize
        var resourceImage;
        if (this.resourceResult && this.resourceResult.images && this.resourceResult.images.length > 0) {
            resourceImage = this.resourceResult.images[0].src;
            // w = this.options.element.offsetWidth;
            // h = Math.floor(this.options.element.offsetWidth / 16 * 9);
            return resourceImage;
        } else if (this.programcardResult) {
            for (var i = 0; i < this.programcardResult.Assets.length; i++) {
                var item = this.programcardResult.Assets[i];
                if (item.Kind === 'Image') {
                    return item.Uri;
                }
            }
            return '';
        }
        // use original image, if defined
        if (this.originalPosterImage !== null) {
            return this.originalPosterImage;
        } else {
            return this.options.appData.urls.defaultImage || '';
        }
    };
    AbstractPlayer.prototype.getMediaAsset = function() {
        var self = this;

        if (!this.programcardResult) {
            console.log('No programcardResult found!')
            return null;
        }

        if (!this.programcardResult.Assets) {
            console.log('No assets found on programcard')
            return null;
        }

        var resources = this.programcardResult.Assets.filter(function (item) {
            return item.Kind === "VideoResource" || item.Kind === "AudioResource";
        });

        if (!resources || resources.length === 0) {
            console.log('No valid resources found: ' + resources);
            return null;
        }

        var matchingTypeAssets = this.programcardResult.Assets.filter(function (item) {
            return (item.Kind === "VideoResource" || item.Kind === "AudioResource") && item.Target === self.options.appData.assetType;
        });

        if (matchingTypeAssets && matchingTypeAssets.length > 0) {
            return matchingTypeAssets[0];
        }

        return resources[0];
    };
    AbstractPlayer.prototype.mapLinks = function(assetData) {
        if (!assetData) {
            console.log('assetData not valid: ' + assetData);
            return null;
        }

        if (!assetData.Links || assetData.Links.length === 0) {
            console.log('no valid Links found in asset: ' + assetData.Links);
            return null;
        }

        return assetData.Links.map(function (item) {
            return {
                "uri": item.Uri,
                "linkType": item.Target,
                "fileType": item.FileFormat,
                "bitrateKbps": item.Bitrate,
                "width": item.Width,
                "height": item.Height
            }
        });
    };
    
    AbstractPlayer.prototype.forgetModel = function () {
            this.resourceResult = null;
            this.programcardResult = null;
    };
    AbstractPlayer.prototype.updateOptions = function (options) {
        this.setOptions(options);
    };
    AbstractPlayer.prototype.resourceName = function () {
        if (this.resourceResult) {
            return this.resourceResult.name;
        } else if (this.programcardResult) {
            return this.programcardResult.Title;
        }
        return '';
    };
    AbstractPlayer.prototype.resourceId = function () {
        if (this.resourceResult) {
            return this.resourceResult.resourceId;
        } else if (this.programcardResult) {
            return this.programcardResult._ResourceId;
        }
        return 0;
    };
    AbstractPlayer.prototype.urn = function() {
        if (this.programcardResult) {
            return this.programcardResult.Urn;
        }

        return null;
    };
    AbstractPlayer.prototype.onDurationChange = function () {
        var dur = this.duration();
        if (dur && dur > 0 && dur !== Infinity) {
            this.hasDuration = true;
            this.fireEvent('durationChange');
        }
    };
    AbstractPlayer.prototype.onPlay = function () {
        this.fireEvent('play');
    };
    AbstractPlayer.prototype.onPause = function () {
        if (!this._forceSeekIntervalId) {
            this.fireEvent('pause');
        }
    };
    AbstractPlayer.prototype.onProgressChange = function () {
        this.fireEvent('progressChange');
    };
    AbstractPlayer.prototype.onBuffering = function (position) {
        this.fireEvent('buffering', position);
    };
    AbstractPlayer.prototype.onBufferingComplete = function (position) {
        this.fireEvent('bufferingComplete', position);
    };
    AbstractPlayer.prototype.onBeforeSeek = function (position) {
        this.fireEvent('beforeSeek', position);
    };
    AbstractPlayer.prototype.onAfterSeek = function (position) {
        this.fireEvent('afterSeek', position);
    };
    AbstractPlayer.prototype.onComplete = function () {
        this.fireEvent('complete');
    };
    AbstractPlayer.prototype.changeChannel = function (channelId) {
        this.fireEvent('changeChannel', channelId);
        this.channelHasChanged = true;
    };
    AbstractPlayer.prototype.changeContent = function (programSLUG, programSerieSlug) {
        this.fireEvent('changeContent', {'programSLUG':programSLUG, 'programSerieSlug':programSerieSlug});
        this.contentHasChanged = true;
    };
    AbstractPlayer.prototype.clearContent = function () {
        this.fireEvent('clearContent');

        if (!this.options.element)
                return;

        this.options.element.innerHTML = ''; //IE friendly disposing of flash player
    };
    AbstractPlayer.prototype.logError = function (errorCode) {
        if (this.options.logging && this.options.logging.errorLogUrl !== null) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET',this.options.logging.errorLogUrl, true);
            xmlhttp.setRequestHeader('Cache-Control', 'no-cache');
            xmlhttp.setRequestHeader('Accept', '*/*');
            xmlhttp.setRequestHeader('Server', 'geo.dr.dk');
            xmlhttp.send('error=' + errorCode + '&url=' + escape(document.location));
        }
    };
    AbstractPlayer.prototype.displayError = function (errorCode) {
        /*jshint devel:true */
        if (window.console && console.log) { console.log('Error: ' + errorCode); }
    };
    AbstractPlayer.prototype.seekToTimeCode = function (timeCode) {
        if (window.console && console.log) { console.log('seekToTimeCode is deprecated, use seek() instead'); }
        this.seek(timeCode);
    };
    AbstractPlayer.prototype.seek = function (value) {
        if (this._forceSeekIntervalId) {
            this._forceSeekComplete();
        }
        this._forceSeekIntervalId = setInterval(this._forceSeek, 1000, this, value);
        this._forceSeek(this, value);
    };
    AbstractPlayer.prototype._forceSeek = function (player, value) {
        var seconds, distance, pos, seekResult;
        player._forceSeekTries ++;
        seekResult = player._seek(value);
        if (typeof(value) === 'string') {
            seconds = player.timeCodeConverter.timeCodeToSeconds(value);
        } else {
            seconds = value * player.duration();
        }
        pos = player.position();
        distance = Math.abs(seconds - pos);
        if (distance < 0.1 || seekResult || !value || player._forceSeekTries > 10) {
            player._forceSeekComplete();
        }

    };
    AbstractPlayer.prototype._forceSeekComplete = function () {
        clearTimeout(this._forceSeekIntervalId);
        this._forceSeekIntervalId = null;
        this._forceSeekTries = 0;
    };
    AbstractPlayer.prototype.queryGeofilter = function () {
        this.json(this.options.appData.urls.geoHandlerUrl, this.handleGeoResponse, this.handleGeoResponseFail, this);
    };
    AbstractPlayer.prototype.handleGeoResponse = function (isInDenmark) {
         console.log('handleGeoResponse() not implemented. Must be overridden in sub class ' + isInDenmark);
    };
    AbstractPlayer.prototype.handleGeoResponseFail = function (status) {
        this.displayError('defaultMsg', 'Failed to load IP check ('+status+')');
    };

    return AbstractPlayer;
});
