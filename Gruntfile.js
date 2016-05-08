module.exports = function(grunt){

  [
    'grunt-contrib-jshint',
  ].forEach(function(task){
    grunt.loadNpmTasks(task);
  });

  grunt.initConfig({
    jshint: {
      app: ['app.js', 'router/**/*.js'],
    }
  });

  grunt.registerTask('default',['jshint']);

};
