require.config({
    urlArgs: 'cb=' + Math.random(),
    paths: {
        'jasmine': 'lib/jasmine-2.0.3/jasmine',
        'jasmine-html': 'lib/jasmine-2.0.3/jasmine-html',
        'jasmine-ajax': 'lib/jasmine-2.0.3/mock-ajax',
        'dr-media-player-factory': 'dist/assets-component-player',
        'dr-media-gemius-implementation': 'dist/assets-component-player',
        'dr-media-gemius-implementation-test': 'dist/assets-component-player',
        'dr-media-sola-implementation': 'dist/assets-component-player',
        'dr-media-springstreams-implementation': 'dist/assets-component-player',
        'dr-media-hash-implementation': 'dist/assets-component-player',
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
        }
    }
});

require(['jasmine-html'], function (jasmine) {

    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var specs = [
        'spec/GemiusimplementationSpec'
    ];
    
    require(specs, function (spec) {
        jasmineEnv.execute();
    });

});