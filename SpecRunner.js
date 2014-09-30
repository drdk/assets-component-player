require.config({
    paths: {
        'jasmine': 'lib/jasmine-2.0.3/jasmine',
        'jasmine-html': 'lib/jasmine-2.0.3/jasmine-html',
        'jasmine-ajax': 'lib/jasmine-2.0.3/mock-ajax',
        'jasmine-boot': 'lib/jasmine-2.0.3/boot',
        'audio-control-play-button': 'dist/assets-component-player',
        'audio-control-volumeselector': 'dist/assets-component-player',
        'dr-media-player-factory': 'dist/assets-component-player',
        'dr-media-gemius-implementation': 'dist/assets-component-player',
        'dr-media-gemius-implementation-test': 'dist/assets-component-player',
        'dr-media-sola-implementation': 'dist/assets-component-player',
        'dr-media-springstreams-implementation': 'dist/assets-component-player',
        'dr-media-hash-implementation': 'dist/assets-component-player',
        'dr-media-psdb-utilities': 'dist/assets-component-player',
        'dr-widget-video-player-factory': 'dist/assets-component-player',
        'dr-widget-video-player': 'dist/assets-component-player',
        'dr-widget-video-playlist': 'dist/assets-component-player',
        'dr-widget-audio-player': 'dist/assets-component-player',
        'dr-widget-audio-playlist': 'dist/assets-component-player',
        'dr-widget-media-playlist': 'dist/assets-component-player',
        'dr-media-class': 'dist/assets-component-player',
        'dr-media-audio-player': 'dist/assets-component-player',
        'dr-media-html5-audio-player': 'dist/assets-component-player',
        'dr-media-flash-audio-player': 'dist/assets-component-player',
        'dr-widget-media-dom-helper': 'dist/assets-component-player',
        'dr-error-messages': 'dist/assets-component-player',
        'swfobject': 'lib/swfobject-1.5/swfobject',
        'swfobject2': 'lib/swfobject-2.2/swfobject',
        'gstream': 'lib/gstream-6.04/gstream',
        'sola': 'lib/sola/akamaihtml5-min',
        'springstreams': 'lib/springstreams-1.5.0/springstreams'
    },
    shim: {
        'jasmine': {
            'exports': 'jasmine'
        },
        'jasmine-html': {
            'deps': ['jasmine'],
            'exports': 'jasmine'
        },
        'jasmine-ajax': {
            'deps': ['jasmine-html'],
            'exports': 'jasmine'
        },
        'jasmine-boot': {
            'deps': ['jasmine-html'],
            'exports': 'jasmine'
        }
    }
});

require(['jasmine-boot'], function (jasmine) {

    var specs = [
        'spec/controls/VolumeSelectorSpec',
        'spec/controls/PlayButtonSpec',
        'spec/addons/PsdbUtillitiesSpec',
        'spec/addons/GemiusimplementationSpec',
        'spec/addons/HashTimeCodeImplementationSpec',
        'spec/MediaClassSpec',
        'spec/utils/DomHelperSpec'
    ];
    
    require(specs, function (spec) {
        window.executeTests();
    });


});