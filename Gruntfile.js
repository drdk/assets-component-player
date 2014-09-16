module.exports = function(grunt) {

	'use strict';

	var config = {

		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options: {
				reporter: require('jshint-stylish')
			},
			all: ['Gruntfile.js', 'src/**/*.js']
		},

		watch: {
			scripts: {
				files: 'src/**/*.js',
				tasks: ['uglify:development']
			},
			styles: {
				files: 'src/**/*.less',
				tasks: ['less:development']
			},
			options: {
				forever: true
			}
		},

		uglify: {
			files: {},
			development: {
				options: {
					compress: false,
					mangle: false,
					beautify: true
				},
				files: '<%=uglify.files%>'
			},
			production: {
				options: {
					compress: true,
					mangle: false,
					sourceMap: true
				},
				files: '<%=uglify.files%>'
			}
		},

		less: {
			files: {
				'dist/assets-component-player.css': 'src/css/index.less'
			},
			development: {
				options: {
					compress: false,
					sourceMap: true,
					outputSourceFiles: true
				},
				files: '<%=less.files%>'
			},
			production: {
				options: {
					compress: true,
					sourceMap: true,
					cleancss: true,
					outputSourceFiles: false
				},
				files: '<%=less.files%>'
			}
		}
	};

	(function /*processYAMLfile*/ () {
		grunt.file.expand('dist/*.js.yaml').forEach(function (file) {
			var index, path;
			var outputName = file.slice(0, file.length - 5);
			var concatFiles = grunt.file.readYAML(file).files;
			for (index in concatFiles) {
				path = concatFiles[index];
				concatFiles[index] = file.slice(0, file.lastIndexOf('/')) + '/' + path;
			}
			config['uglify'].files[outputName] = concatFiles;
		});
	})();

	grunt.initConfig(config);

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');

	grunt.registerTask('default', ['dev-nowatch']);

	grunt.registerTask('dev', 'Development build (will be watching!)', function () {
		grunt.task.run('dev-nowatch', 'watch');
	});

	grunt.registerTask('dev-nowatch', 'Development build (no watching!)', function () {
		grunt.task.run('uglify:development', 'less:development');
	});

	grunt.registerTask('prod', 'Production build', function () {
		grunt.task.run('uglify:production', 'less:production');
	});

};