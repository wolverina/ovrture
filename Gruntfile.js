module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    uglify: {
       options: {
        mangle: false
      },
      my_target: {
        files: {
          'dist/assets/js/main.min.js': ['src/assets/js/vendor/*.js', 'src/assets/js/main.js']
        }
      }
    },

    grunticon: {
      options: {
        src: "src/assets/img/",
        dest: "dist/assets/css/icn"
      }
    },

    targethtml: {
      dist: {
        files: {
          'dist/index.html': 'src/index.html'
        }
      }
    },

    htmlmin: {                                     
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: false,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true
        },
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    },
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-grunticon');
  grunt.loadNpmTasks('grunt-targethtml');

  // Default task(s).
  grunt.registerTask('default', ['grunticon', 'uglify', 'targethtml', 'htmlmin']);


};