/**
 * @author Gemius / gemiusStream
 * @version 6.04
 * @date 2013-11-01
 * @for original script see: gstream_long.js
*/

function gemius_pending(i) { window[i] = window[i] || function() {var x = window[i+'_pdata'] = window[i+'_pdata'] || []; x[x.length]=arguments;};};
gemius_pending('gemius_hit'); gemius_pending('gemius_event'); gemius_pending('pp_gemius_hit'); gemius_pending('pp_gemius_event');

function gsm_gemius_escape(str,limit) {
	function Hex(n) {
		var hexMap = "0123456789ABCDEF";
		return hexMap.charAt(n>>4)+hexMap.charAt(n&0xF);
	}
	var c,s,uc,ul;
	var dst = "";
	for (var i=0 ; i<str.length ; i++) {
		c = str.charCodeAt(i);
		if ((c>=0xDC00)&&(c<0xE000)) continue;
		if ((c>=0xD800)&&(c<0xDC00)) {
			i++;
			if (i>=str.length) continue;
			s = str.charCodeAt(i);
			if ((s<0xDC00)||(s>=0xE000)) continue;
			c = ((c-0xD800)<<10)+(s-0xDC00)+0x10000;
		}
		if (c<0x80) {
			uc = escape(String.fromCharCode(c)).replace(/\+/g,"%2B").replace(/\//g,"%2F");
			if (c<=0x20) {
				ul=3;
			} else {
				ul=1;
			}
		} else if (c<0x800) {
			uc = "%"+Hex((c>>6)|0xC0)+"%"+Hex((c&0x3F)|0x80);
			ul = 2;
		} else if (c<0x10000) {
			uc = "%"+Hex((c>>12)|0xE0)+"%"+Hex(((c>>6)&0x3F)|0x80)+"%"+Hex((c&0x3F)|0x80);
			ul = 3;
		} else if (c<0x200000) {
			uc = "%"+Hex((c>>18)|0xF0)+"%"+Hex(((c>>12)&0x3F)|0x80)+"%"+Hex(((c>>6)&0x3F)|0x80)+"%"+Hex((c&0x3F)|0x80);
			ul = 4;
		} else {
			uc = "";
			ul = 0;
		} 
		limit -= ul;
		if (limit<0) {
			return dst;
		}
		dst+=uc;
	}
	return dst;
}

if(!gSmDebug){
	var gSmDebug = new function(){

		this.DEBUGLEVEL_CONNECTOR = "connector";
		this.DEBUGLEVEL_LOG = "log";
		this.DEBUGLEVEL_INPUT = "input";
		this.DEBUGLEVEL_INTERNAL = "internal";
		this.DEBUGLEVEL_OUTPUT = "output";
		this.ACTIONNAME_NEW_STREAM = "newStream";
		this.ACTIONNAME_EVENT = "event";
		this.ACTIONNAME_CLOSE_STREAM = "closeStream";
		this.ACTIONNAME_SEND_HIT = "sendHit";
		this.ACTIONNAME_LOG = "log";

		this._connectionId = "_" + ((new Date()).getTime().toString(36)) + "_" + (Math.floor(Math.random() * 99999).toString(36));
		this._isEliminated = false;
		this._isRegistered = false;
		this._registerInterval = Math.floor(2000 + (Math.random() * 1000));
		this._actionsBuffer = new Array();

		this.init = function(){
			setTimeout("gSmDebug._sendRegisterRequest()", this._registerInterval);
		}

		this.receiveConfirmation = function(){
			this.send(this.DEBUGLEVEL_CONNECTOR, "", "", this.ACTIONNAME_LOG, ["<PLAYER>[" + this._connectionId + "]" + " >> Confirmation received."]);
			this._isRegistered = true;
			setTimeout("gSmDebug._releaseEventsBuffer()", 1);
		}

		this.send = function(debugLevel, playerId, contentId, actionName, actionData) {
			if (!this._isEliminated) {
				var action = new Object();
				action["debugLevel"] = debugLevel;
				action["connectionId"] = this._connectionId;
				action["timestamp"] = new Date().getTime();
				action["playerId"] = playerId;
				action["contentId"] = contentId;
				action["actionName"] = actionName;
				action["actionData"] = actionData;
				if (this._isRegistered) {
					this._sendActionToDebugger(action);
				} else {
					this._actionsBuffer.push(action);
				}
			}
		}

		this._sendRegisterRequest = function(){
			if (!gSmDebug._isRegistered) {
				gSmDebug.send(gSmDebug.DEBUGLEVEL_CONNECTOR, "", "", gSmDebug.ACTIONNAME_LOG, ["<PLAYER>[" + gSmDebug._connectionId + "]" + " >> Send to <DEBUGGER>.register(" + gSmDebug._connectionId + ")."]);
				if(gSmDebug._getDebugger()) {
					gSmDebug._getDebugger().register(gSmDebug._connectionId);
				}

				gSmDebug._registerInterval += Math.floor(1000 + (Math.random() * 500));
				if(gSmDebug._registerInterval < 60000) {
					setTimeout("gSmDebug._sendRegisterRequest()", gSmDebug._registerInterval);
				}
			}
		}

		this._releaseEventsBuffer = function() {
			for (var i = 0; i < gSmDebug._actionsBuffer.length; i++) {
				gSmDebug._sendActionToDebugger(gSmDebug._actionsBuffer[i]);
			}
			gSmDebug._actionsBuffer = new Array();
		}

		this._sendActionToDebugger = function(action) {
			if (this._getDebugger()) {
				this._getDebugger().receiveAction(action["debugLevel"], action["connectionId"], action["timestamp"], action["playerId"], action["contentId"], action["actionName"], action["actionData"]);
			}
		}

		this._getDebugger = function() {
			return document.getElementById("gSmDebugger");
		}

		this.init();

	}
}

if(!gSmUtil){
	var gSmUtil = new function(){

		this._protectedInterval = 100;
		this._oldSystemTime = (new Date()).getTime();
		this._oldSystemTimeTmp = (new Date()).getTime();
		this._newSystemTime = (new Date()).getTime();
		this._currentTime = 0;
		this._delta = 0;

		this.init = function(){
			setTimeout("gSmUtil._updateProtectedTime()", this._protectedInterval);
		}

		this.getTimeSec = function(){
			return this._currentTime;
		}

		this.isOpera = function(){
			return (window.opera);
		}

		this.isSafari = function(){
			if(this.isChrome()) return false;
			return (navigator.userAgent.toLowerCase().indexOf('safari') != -1);
		}

		this.isChrome = function(){
			return (navigator.userAgent.toLowerCase().indexOf('chrome') != -1);
		}

		this.isIE = function(){
			return (navigator.appName.toLowerCase().indexOf("microsoft") != -1);
		}

		this.isFF = function(){
			return (navigator.userAgent.toLowerCase().indexOf("firefox") != -1);
		}

		this.getBytesLength = function(str) {
			return encodeURIComponent(str).replace(/%../g, 'x').length;
		}

		this.limitBytesLength = function(str, maxBytes, restricted) {
			var currBytes = 0;
			var outStr = "";
			str = this._normalizeString(str, restricted);
			for (var i = 0 ; i < str.length ; i++ ) {
				currBytes += this.getBytesLength(str.charAt(i));
				if (currBytes > maxBytes) return outStr;
				outStr += str.charAt(i);
			}
			return outStr;
		}

		this.sendHit = function(hitcollector, identifier, encoding, data) {
			identifier += '&sargencoding=' + encoding;
			identifier += '&sarg=' + gsm_gemius_escape(data,1023);
			gemius_hit.apply(window, [identifier]);
		}

		this._updateProtectedTime = function(){
			setTimeout("gSmUtil._updateProtectedTime()", gSmUtil._protectedInterval);
			gSmUtil._newSystemTime = (new Date()).getTime();
			var diff = gSmUtil._newSystemTime - gSmUtil._oldSystemTimeTmp - gSmUtil._protectedInterval;
			if(diff < -1000 || diff > 60000){
				gSmUtil._delta -= diff;
			}
			gSmUtil._oldSystemTimeTmp = gSmUtil._newSystemTime;
			gSmUtil._currentTime = Math.floor((gSmUtil._newSystemTime - gSmUtil._oldSystemTime + gSmUtil._delta)/1000);
		}

		this._normalizeString = function(str,restricted) {
			var result = "";
			for (var i=0; i < str.length; i++) {
				var ok = true;
				for (var j=0; j < restricted.length; j++) {
					if (str.charAt(i) == restricted[j]) {
						ok = false;
						break;
					}
				}
				result += (ok) ? str.charAt(i) : " ";
			}
			return result;
		}

		this.init();

	}
}

if(!gSmNoUnload){
	var gSmNoUnload = new function(){

		this.COOKIE_LIFE_TIME_IN_DAYS = 4;
		this.STREAM_HISTORY_LIFE_TIME = 259200000;
		this.STREAM_HISTORY_BUFFOR_TIME = 2000;
		this.UPDATESTREAM_INTERVAL = 500;
		this.STREAMS_SLOTS_LIMIT = 3;

		this._streams = [];
		this._streamsMatch = {};
		this._cookieOldVal = null;

		this.init = function(){			
			if (this.hasUnload()) return;
			this._sendAllStreams();
			setTimeout("gSmNoUnload._updateStreams()", this.UPDATESTREAM_INTERVAL);
		}

		this.hasUnload = function(){
			if (gSmUtil.isOpera() || gSmUtil.isChrome() || gSmUtil.isSafari()) return false;
			return true;
		}

		this.addStream = function(stream, gSmId, gSmHc){
			if (this.hasUnload()) return;
			var cookieId = (new Date()).getTime() + "" + Math.round(Math.random() * 1000);
			this._streams.push({cookieId:cookieId ,stream:stream, identifier:gSmId, hitcollector:gSmHc, startTime:(new Date()).getTime()});
			return cookieId;
		}

		this.updateStream = function(cookieId){
			if (this.hasUnload()) return;
			var stream, hitcollector, identifier, encoding, lastTime, startTime, currentPackage;
			stream = this._getStream(cookieId);
			identifier = stream.identifier;
			hitcollector = stream.hitcollector;
			encoding = gSmConfig.ENCODING;
			startTime = stream.startTime;
			currentPackage = stream.stream.getCurrentPackage();
			lastTime = (new Date()).getTime();
			this._writeStream(cookieId, hitcollector, identifier, encoding, startTime, lastTime, currentPackage);
		}

		this._getStream = function(cookieId){
			for (var i=0; i < this._streams.length; i++){
				if (this._streams[i].cookieId == cookieId) return this._streams[i];
			}
			return null;
		}

		this._updateStreams = function(){
			setTimeout("gSmNoUnload._updateStreams()", this.UPDATESTREAM_INTERVAL);
			for (var i=0; i < gSmNoUnload._streams.length; i++) {
				gSmNoUnload.updateStream(gSmNoUnload._streams[i].cookieId);
			}
		}

		this._writeStream = function(cookieId, hitcollector, identifier, encoding, startTime, lastTime, sargData){
			this._createCookie(cookieId, (escape(hitcollector) + "|" + escape(identifier) + "|" + escape(encoding) + "|" + escape(startTime) + "|" + escape(lastTime) + "|" + escape(sargData) ));
		}

		this._sendAllStreams = function(){
			var streamsData = this._getAllCookies();
			for (var s in streamsData){

				if ((new Date()).getTime() - streamsData[s].lastTime > this.STREAM_HISTORY_BUFFOR_TIME) {
					var tdiff = (new Date()).getTime() - streamsData[s].startTime;

					if (tdiff > 0 && tdiff < this.STREAM_HISTORY_LIFE_TIME) {
						var sargDataArr = streamsData[s].sargData.split("|");
						var lastEventArr = sargDataArr[sargDataArr.length-1].split(";");
						if (lastEventArr[lastEventArr.length - 1][0] == 0){
							sargDataArr.splice(sargDataArr.length-1, 1);
						}

						if (sargDataArr.length >= 8){
							sargDataArr[6] = Number(sargDataArr[6])+Math.round(tdiff/1000);
							streamsData[s].sargData = sargDataArr.join("|");
							gSmUtil.sendHit(streamsData[s].hitcollector, streamsData[s].identifier, streamsData[s].encoding, streamsData[s].sargData);
							gSmDebug.send(gSmDebug.DEBUGLEVEL_OUTPUT, "", "", gSmDebug.ACTIONNAME_SEND_HIT, [streamsData[s].sargData, "Cookie"]);
						} 
					}
					this._eraseCookie(s);
				}
			}
		}

		this._getAllCookies = function(){
			var pairs = document.cookie.split(";");
			var cookies = {};
			var params;
			for (var i=0; i<pairs.length; i++) {
				var pair = pairs[i].split("=");
				if (pair[0].split("gsm_").length > 1) {
					params = pair[1].split("|");
					cookies[pair[0]] = {
						hitcollector: unescape(params[0]),
						identifier: unescape(params[1]),
						encoding: unescape(params[2]),
						startTime: unescape(params[3]),
						lastTime: unescape(params[4]),
						sargData: unescape(params[5])
					};
				}
			}
			return cookies;
		}

		this._createCookie = function(cookieId, value, remove) {
			if (!remove) remove = false;
			setTimeout("gSmNoUnload._createCookieThread('" + cookieId + "','" + value + "'," + remove + ")", 1);
		}

		this._getCookieSlot = function(){
			this._sendAllStreams();
			var slots = [];
			for (var i=0; i < this.STREAMS_SLOTS_LIMIT; i++){
				slots[i] = true;
			}
			var streamsData = this._getAllCookies();
			for (var s in streamsData) {
				var slot = s.split("gsm_c")[1];
				slots[slot] = false;
			}
			for (var i=0 ; i < slots.length; i++) {
				if (slots[i]) return i;
			}
			return null;
		}

		this._createCookieThread = function(cookieId, value, remove) {
			var name = cookieId;
			if (!remove) {
				if (this._streamsMatch[cookieId] == null) {
					var ck = this._getCookieSlot();
					if (ck==null) return;
					this._streamsMatch[cookieId] = "gsm_c"+ck;
				}
				name = this._streamsMatch[cookieId];
			}

			var days = (remove) ? -1 : this.COOKIE_LIFE_TIME_IN_DAYS;
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			var expires = "; expires="+date.toGMTString();

			var newCookieContent = name + "=" + value+expires + "; path=/";
			if (newCookieContent == this._cookieOldVal) return;

			document.cookie = newCookieContent;
			this._cookieOldVal = newCookieContent;
		}

		this._eraseCookie = function(cookieId) {
			this._createCookie(cookieId, "", true);
		}

		this.init();

	}
}

var gSmStream = function(contentId, player){

	this._contentId = contentId;
	this._contentIdFormated = gSmUtil.limitBytesLength(contentId, gSmConfig.MAX_ID_LENGTH, gSmConfig.ID_RES);
	this._player = player;

	this.init = function(){
		this._closing = false;
		this.duration = null;
		this.time = null;
		this.customPackageString = "";
		this.additionalPackageString = "";
		this.lastPlayTime = null;
		this.lastEvent = "";
		this.lastPlayEndTime = null;
		this.firstTimeStamp = gSmUtil.getTimeSec();
		this.lastTimeStamp = gSmUtil.getTimeSec();
		this.isPlaying = false;
		this.forcedClose = false;
		this.controlBreak = false;
		this.eventString = "";
		this.eventId = "";
		this.viewId = "";
		this.cookieId = "";
		this.gSmId = "";
		this.gSmHost = "";
		this.treeIdString = "";
		this.realPlaying = false;
	}

	this.init();

	this.newStream = function (duration, customPackage, additionalPackage, gSmId, gSmHc, treeId){
		this.init();
		this.gSmId = (gSmId == undefined || gSmId == null) ? gsm_gemius_identifier : gSmId;
		this.cookieId = gSmNoUnload.addStream(this, this.gSmId, this.gSmHc);
		this.duration = (duration>0) ? Math.round(duration) : -1;
		this.time = 0;
		this.customPackageString = this._formatPackage(customPackage);
		this.additionalPackageString = this._formatPackage(additionalPackage);
		this.treeIdString = this._formatTree(treeId);
		gSmDebug.send(gSmDebug.DEBUGLEVEL_INTERNAL, this._player.playerId, this._contentId, gSmDebug.ACTIONNAME_NEW_STREAM, [this.duration, this.customPackageString, this.additionalPackageString, this.treeIdString]);
	}

	this.event = function(time, eventType){
		this.forcedClose = false;
		this.time = time;

		if (this.lastEvent == eventType) return;

		gSmDebug.send(gSmDebug.DEBUGLEVEL_INTERNAL, this._player.playerId, this._contentId, gSmDebug.ACTIONNAME_EVENT, [Math.round(time), eventType]);
		switch(eventType){
			case "playing":
				if (this.isPlaying) return;

				if (this.eventString == "") this.firstTimeStamp = gSmUtil.getTimeSec();
				this.lastTimeStamp = gSmUtil.getTimeSec();
				this.lastPlayTime = time;
				if (!this.firsPlayingEvent) this._sendFirsPlayingEvent();
				this.eventId = "p";
				this.realPlaying = true;
				this.isPlaying = true;
				this.viewId = "";
				break;
			case "complete":
				this.eventId = "c";
				this.lastPlayEndTime = time;
				this.sendStream();
				this.isPlaying = false;
				this.viewId = "";
				this.firsPlayingEvent = false;
				break;
			default:
				switch(eventType){
					case "paused":
						this.eventId = "p";
						break;
					case "stopped":
						this.eventId = "s";
						break;
					case "buffering":
						this.eventId = "b";
						break;
					case "seekingStarted":
						this.eventId = "r";
						break;
					default:
						this.eventId = "p";
						break;
				}
				if (this.lastPlayTime == null)return;
				this.lastPlayEndTime = time;
				this.controlBreak = "length";
				var currEvent = this._getCurrEvent();
				if (!this._checkBufforAndSendHit(currEvent)) {
					this.eventString += this._makeCurrEventViewId(currEvent);
				}
				this.isPlaying = false;
				break;
		}
	}

	this.closeStream = function(time){
		this._closing = true;
		this.time = time;
		this.lastPlayEndTime = time;
		gSmDebug.send(gSmDebug.DEBUGLEVEL_INTERNAL, this._player.playerId, this._contentId, gSmDebug.ACTIONNAME_CLOSE_STREAM, [Math.round(this.time)]);
		this.sendStream();
		this.isPlaying = false;
	}

	this.getCurrentPackage = function(){
		var events = this._getEvents(true);
		var viewId = (this.viewId != "") ? ("#" + this.viewId) : ("");
		return this._getFormatedData() + "|" + Math.round(this.lastTimeStamp - this.firstTimeStamp) + ";" + Math.round(this.lastPlayTime) + ";" + Math.round(this._getPlayLength(true)) + viewId + events;
	}

	this.closeStreamForced = function(){
		this._closing = true;
		gSmDebug.send(gSmDebug.DEBUGLEVEL_INTERNAL, this._player.playerId, this._contentId, gSmDebug.ACTIONNAME_CLOSE_STREAM, [Math.round(this.time)]);
		this.forcedClose = true;
		this.sendStream();
		this.isPlaying = false;
	}

	this.sendStream = function(controlBreak){
		this.controlBreak = (controlBreak == undefined || controlBreak == null) ? "" : controlBreak;
		if (this.controlBreak == "time" && (this._getCurrEvent() + this.eventString != "")){
			if (this.viewId == "") {
				this.viewId = gemiusStream.newViewId();
			}
		}
		var playLength = this._getPlayLength();
		var currEvent = this._getCurrEvent();
		if (!this._checkBufforAndSendHit(currEvent)) {
			this.eventString += this._makeCurrEventViewId(currEvent);
			this._sendHit("");
			this.lastPlayTime += playLength;
		}
		if (this.controlBreak == "time") {
			this.realPlaying = false;
		}
	}

	this.hasEvent = function(){
		this.forcedClose = true;
		if (this.eventString + this._getCurrEvent() != "") {
			return true;
		}
		return false;
	}

	this._formatPackage = function(arr) {
		var str = "";
		var criterion;
		var category;
		var max_i = (arr.length > gSmConfig.MAX_CRITERIONS) ? gSmConfig.MAX_CRITERIONS : arr.length;
		for (var i = 0; i < max_i; i++) {
			switch (typeof(arr[i])) {
				case ("string"):
					arr[i] = arr[i].split("=");
					break;
				case ("object"): //FIX dont use objects in array. Only Strings in array
					if (!arr[i].length) arr[i] = [arr[i]["name"], arr[i]["value"]];
					break;
				default:
					arr[i] = [];
					break;
			}			
			if (arr[i].length == 2) {
				criterion = gSmUtil.limitBytesLength(arr[i][0], gSmConfig.MAX_CRITERION_LENGTH, gSmConfig.CRITERION_RES);
				category = gSmUtil.limitBytesLength(arr[i][1], gSmConfig.MAX_CATEGORY_LENGTH, gSmConfig.CATEGORY_RES);
				if (i > 0) str += ";";
				str += criterion + "=" + category;
			}
		}
		return str;
	}

	this._formatTree = function(arr) {
		var out = arr.join(",");
		while (arr.length > 0 && gSmUtil.getBytesLength(out) > gSmConfig.MAX_TREE_ID_LENGTH){
			arr.pop();
			out = arr.join(",");
		}
		return out;
	}

	this._checkBufforAndSendHit = function(currEvent) {
		if (gSmUtil.getBytesLength(this._getFormatedData()) + currEvent.length + 1 >= (gSmConfig.MAX_LOG_LENGTH + gSmConfig.VIEW_ID_LENGTH)){
			this._sendHit(currEvent);
			return true;
		}
		return false;
	}

	this._sendFirsPlayingEvent = function() {
		this._sendHit("", true);
		this.firsPlayingEvent = true;
	}

	this._makeCurrEventViewId = function(currEvent) {
		return currEvent + ((this.viewId != "" && currEvent != "") ? ("#" + this.viewId) : (""));
	}

	this._getPlayLength = function(operaCheck) {
		if (operaCheck == undefined || operaCheck == null) operaCheck = false;
		if (this.isPlaying == false) return 0;
		var tCalc, tGet, tGetR;
		tCalc = gSmUtil.getTimeSec() - this.lastTimeStamp;
		tGet = this.lastPlayEndTime - this.lastPlayTime;
		tGetR = Math.round(this.lastPlayEndTime) - Math.round(this.lastPlayTime);
		if(this.forcedClose == true || this.duration==-1 || this.controlBreak != "" || operaCheck == true){
			return tCalc;
		} else if (tGetR==1 || tGetR==0) {
			return tGetR;
		} else if (tCalc<=0) {
			return tGet;
		} else if (tGet<=0) {
			return tCalc;
		} else {
			return Math.min(tCalc, tGet);
		}
	}

	this._getEvents = function(exit){
		exit = (exit == undefined)?false:exit;
		var events = "";
		if (this.controlBreak == "" || this.controlBreak == "length" || exit) {
			events = ((this.viewId != "") ? "" : "^p") + ((this.forcedClose || exit || this._closing) ? "$q" : ("$"+this.eventId));
		} else {
			events = (this.realPlaying) ? "^p" : "";
			if (this.eventId != "p") events = "^" + this.eventId;
		}
		return events;
	}

	this._getCurrEvent = function(){
		var playLength = Math.round(this._getPlayLength());
		if (playLength > 0) {
			return "|" + Math.round(this.lastTimeStamp - this.firstTimeStamp) + ";" + Math.round(this.lastPlayTime) + ";" + playLength + this._getEvents();
		}else{
			return "";
		}
	}

	this._sendHit = function(currEvent, forced){
		if (forced == undefined) {
			forced = false;
		}
		if (this.eventString == "" && currEvent == "" && forced == false) {
			return;
		}
		this.eventString += currEvent;
		if (this.eventId == "c"){
			var parr = this.eventString.split("|");
			var estr = parr[parr.length-1];
			var st = estr.indexOf("$");
			var fstr = estr.substring(0,st) + "$c" + estr.substring(st + 2, estr.length);
			parr[parr.length-1] = fstr;
			this.eventString = parr.join("|");
		}
		var outputData = this._getFormatedData(forced);
		this.eventString = "";
		this.firstTimeStamp = gSmUtil.getTimeSec();
		this.lastTimeStamp = gSmUtil.getTimeSec();		
		gSmUtil.sendHit(this.gSmHc, this.gSmId, gSmConfig.ENCODING, outputData);
		gSmDebug.send(gSmDebug.DEBUGLEVEL_OUTPUT, this._player.playerId, this._contentId, gSmDebug.ACTIONNAME_SEND_HIT, [outputData]);
		gSmNoUnload.updateStream(this.cookieId);
	}

	this._getFormatedData = function(forced){
		var out = "";
		var delta = Math.round(gSmUtil.getTimeSec() - this.firstTimeStamp);
		var forcedData = "";
		if (forced) forcedData = "|" + Math.round(gSmUtil.getTimeSec() - this.firstTimeStamp) + ";" + Math.round(this.lastPlayTime) + ";0!f";
		out = "v=" + gSmConfig.VERSION + "|" + this.treeIdString + "|" + this._contentIdFormated + "|" + this.duration + "|" + this.customPackageString + "|" + this.additionalPackageString + "|" + delta + forcedData;
		out += this.eventString;
		return out;
	}

}

var gSmPlayer = function(playerId){

	this.playerId = playerId;
	this._streamsArray = new Array();

	this.newStream = function(contentId, duration, customPackage, additionalPackage, gSmId, gSmHost, treeId){
		var stream = this._getStream(contentId, true);
		stream.newStream(duration, customPackage, additionalPackage, gSmId, gSmHost, treeId);
	}

	this.event = function(contentId, time, eventType){
		var stream = this._getStream(contentId);
		if (stream == null) return;
		stream.event(time, eventType);
	}

	this.closeStream = function(contentId, time){
		var stream = this._getStream(contentId);
		if (stream == null) return;
		stream.closeStream(time);
		this._removeStream(contentId);
	}

	this.sendAllStreams = function(type){
		for (var i=0; i < this._streamsArray.length; i++) {
			this._streamsArray[i].sendStream(type);
		}
	}
	this.checkAllStreams = function(){
		for (var i=0; i < this._streamsArray.length; i++) {
			if (this._streamsArray[i].hasEvent()) return true;
		}
		return false;
	}
	this.closeAllStreams = function(){
		for (var i=0; i < this._streamsArray.length; i++) {
			this._streamsArray[i].closeStreamForced();
		}
	}

	this._getStream = function(contentId, forced){
		forced = (forced) ? true : false;
		var stream = null;
		for (var i=0; i < this._streamsArray.length; i++) {
			if (this._streamsArray[i]._contentId == contentId) stream = this._streamsArray[i];
		}
		if (stream == null && forced) {
			stream = new gSmStream(contentId, this);
			this._streamsArray.push(stream);
		}
		return stream;
	}

	this._removeStream = function(contentId) {
		for (var i=0; i < this._streamsArray.length; i++) {
			if (this._streamsArray[i].contentId == contentId) {
				delete this._streamsArray[i];
				this._streamsArray.splice(i, 1);
			}
		}
	}

}

if (!gSmConfig){
	var gSmConfig = new function(){

		this.VERSION = 6;
		this.MAX_CRITERIONS = 6;
		this.MAX_CRITERION_LENGTH = 16;
		this.MAX_CATEGORY_LENGTH = 64;
		this.MAX_TREE_ID_LENGTH = 64;
		this.MAX_ID_LENGTH = 64;
		this.VIEW_ID_LENGTH = 16;
		this.ID_RES = ["|", "*", "\n", "\t", "\r"];
		this.CRITERION_RES = ["|", "*", "\n", "\t", "\r", ";", "=", "/", "#"];
		this.CATEGORY_RES = ["|", "*", "\n", "\t", "\r", ";", "=", "/", "#"];
		this.TIMEOUT = 300;
		this.MAX_LOG_LENGTH = 990;
		this.ENCODING = "utf-8";

		this.setEncoding = function(encoding){
			this.ENCODING = encoding;
		}

	}
}

if(!gemiusStream){
	var gemiusStream = new function(){

		this._lastTimeCheck = gSmUtil.getTimeSec();
		this._viewId = 0;

		this.init = function(){
			this.session = (new Date()).getTime().toString(36) + Math.round(Math.random() * 100000000).toString(36) + Math.round(Math.random() * 100000000).toString(36);
			this.playersArray = new Array();
			if(gSmNoUnload.hasUnload()){
				if (window.addEventListener){
					window.addEventListener('unload', this.onUnload, true);
				} else if(window.attachEvent){
					window.attachEvent('onunload', this.onUnload);
				}
			}
			setTimeout("gemiusStream._timeCheck()", 1000);
		}

		this.newStream = function(playerId, contentId, duration, customPackage, additionalPackage, gSmId, gSmHc, treeId){
			gSmDebug.send(gSmDebug.DEBUGLEVEL_INPUT, playerId, contentId, gSmDebug.ACTIONNAME_NEW_STREAM, [duration, customPackage, treeId, additionalPackage]);
			if (playerId == null || contentId == null || playerId==undefined || contentId==undefined) return;
			if (customPackage == null) customPackage = new Array();
			if (additionalPackage == null) additionalPackage = new Array();
			if (treeId == null) treeId = new Array();
			var player = this._getPlayer(playerId);
			player.newStream(contentId, duration, customPackage, additionalPackage, gSmId, gSmHc, treeId);
		}

		this.event = function(playerId, contentId, time, eventType){
			gSmDebug.send(gSmDebug.DEBUGLEVEL_INPUT, playerId, contentId, gSmDebug.ACTIONNAME_EVENT, [time, eventType]);
			if (playerId == null || contentId == null || playerId==undefined || contentId==undefined) return;
			var player = this._getPlayer(playerId);
			player.event(contentId, time, eventType);
		}

		this.closeStream = function(playerId, contentId, time){
			gSmDebug.send(gSmDebug.DEBUGLEVEL_INPUT, playerId, contentId, gSmDebug.ACTIONNAME_CLOSE_STREAM, [time]);
			if (playerId == null || contentId == null || playerId==undefined || contentId==undefined) return;
			var player = this._getPlayer(playerId);
			player.closeStream(contentId, time);
		}

		this.checkAllStreams = function(){
			for (var i=0; i < this.playersArray.length; i++) {
				if (this.playersArray[i].checkAllStreams()) return true;
			}
			return false;
		}

		this.closeAllStreams = function(){
			for (var i=0; i < this.playersArray.length; i++) {
				this.playersArray[i].closeAllStreams();
			}
		}

		this.onUnload = function(){
			if (!gemiusStream.checkAllStreams()) return;
			gemiusStream.closeAllStreams();
			var start = (new Date()).getTime();
			while (start + 200 > (new Date()).getTime()); //pause to send hit (200ms)
		}

		this.viewId = function(){
			return this._viewId;
		}

		this.newViewId = function(){
			this._viewId ++;
			return this._viewId;
		}

		this._getPlayer = function(playerId){
			var player = null;
			for (var i=0 ; i<this.playersArray.length ; i++) {
				if(this.playersArray[i].playerId == playerId) player = this.playersArray[i];
			}
			if(player == null){
				player = new gSmPlayer(playerId);
				this.playersArray.push(player);
			}
			return player;
		}

		this._timeCheck = function(){
			setTimeout("gemiusStream._timeCheck()", 1000);
			if (gSmUtil.getTimeSec() - gemiusStream._lastTimeCheck >= gSmConfig.TIMEOUT) {
				gemiusStream._lastTimeCheck = gSmUtil.getTimeSec();
				gSmDebug.send(gSmDebug.DEBUGLEVEL_LOG, "", "", gSmDebug.ACTIONNAME_LOG, ["timeCheck"]);
				this._sendAllStreams();
			}
		}

		this._sendAllStreams = function(){
			for (var i=0 ; i<this.playersArray.length ; i++) {
				this.playersArray[i].sendAllStreams("time");
			}
		}

		this.init();

	}
}

(function(d,t) {var ex; try {var gt=d.createElement(t),s=d.getElementsByTagName(t)[0],l='http'+((location.protocol=='https:')?'s':'');
gt.async='true'; gt.defer='true'; gt.src=l+'://pro.hit.gemius.pl/gemius.js'; s.parentNode.insertBefore(gt,s);} catch (ex) {}}(document,'script'));

