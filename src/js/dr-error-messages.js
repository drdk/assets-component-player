define('dr-error-messages', [], 
function () {
    'use strict';

    var DrErrorMessages = {
    	getMediaErrorHeader: function(headerType) {
    		switch (headerType) {
    			case "access_denied_od":
    				return "DR TV On Demand";
    			case "access_denied_live":
    				return "DR TV LIVE-udsendelse";
    			case "default":
    			default:
    				return "Fejlmeddelelse";
    		};
    	},
	    getMediaErrorMessage: function(mediaType, errorCode) {
	    	if (mediaType === "audio") {
	    		switch (errorCode) {
	    			case "access_denied":
	    				return "Denne lydfil er af ophavsretsmæssige årsager beskyttet mod visning udenfor Danmark. Hvis du befinder dig i Danmark og mener du har fået denne besked ved en fejl, kontakt os da på brugerhenvendelsessiden";
	    			case "not_found":
	    				return "Programmet du søger findes desværre ikke.";
	    			case "connection_failed":
	    				return "Der er desværre sket en fejl. Læs om driftstatus og kontakt til DR på brugerhenvendelsessiden";
	    			case "timeout":
	    				return "Afspilleren har været inaktiv for længe. Genindlæs siden, så kan du se videoen igen.";
	    			case "obsolete_flash_player":
	    				return "Du skal have <a href='http://get.adobe.com/flashplayer/'>Adobe Flash Player 10 eller nyere</a> installeret for at høre dette.";
	    			case "defaultMsg":
	    			default:
	    				return "Der er desværre sket en fejl. Vi kigger på sagen, så prøv igen senere!";
	    		}
	    	} else if (mediaType === "video") {
	    		switch (errorCode) {
	    			case "access_denied_od":
	    				return "Af rettighedsmæssige årsager kan vi ikke afspille denne udsendelse. Sidder du ved en computer med en udenlandsk ip-adresse, kan det være grunden til at du ikke kan se programmet.";
	    			case "access_denied_live":
	    				return "Af rettighedsmæssige årsager kan vi ikke afspille denne live kanal i øjeblikket. Det skyldes enten at<ul><li>- Man kan ikke se DR’s livekanaler fra udlandet, da DR sender mange programmer, der af rettighedsmæssige grunde ikke må vises uden for Danmark. Sidder du ved en computer med en udenlandsk ip-adresse, kan det være grunden til at du ikke kan se programmet.</li></ul>eller<ul><li>- Ved nogle udsendelser har DR ikke rettigheder til at vise indholdet på dr.dk på grund af ældre rettighedsaftaler, der ikke inkluderer tilladelse til streaming.</li></ul>";
	    			case "not_found":
	    				return "Programmet du søger findes desværre ikke.";
	    			case "connection_failed":
	    				return "Der er desværre sket en fejl. Læs om driftstatus og kontakt til DR på <a href='/tv/feedback'>brugerhenvendelsessiden</a>.";
	    			case "timeout":
	    				return "DR beklager at udsendelsen ikke afspilles. Vi undersøger sagen, og anbefaler at der forsøges igen senere.";
	    			case "plugin_not_found":
	    				return "En nødvendig komponent kunne ikke hentes.<br/>Læs om driftstatus og kontakt til DR på <a href='/tv/feedback'>brugerhenvendelsessiden</a>.";
	    			case "obsolete_flash_player":
	    				return "Du skal have <a href='http://get.adobe.com/flashplayer/'>Adobe Flash Player 10.2 eller nyere</a> installeret for at se denne video.";
		    			break;
		    		case "encryption_not_supported":
		    			return "Denne udsendelse kan desværre ikke afspilles på din enhed.";
	    			case "defaultMsg":
	    			default:
	    				return "Der er desværre sket en fejl. Vi kigger på sagen, så prøv igen senere.";
	    		}
	    	} else {
	    		throw "Unsupported media type: [" + mediaType + "]";
	    	}
	    }
    }

    return DrErrorMessages;
});
