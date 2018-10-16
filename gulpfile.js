var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename"),
    sourcemaps = require('gulp-sourcemaps'),
    pump = require('pump');

var buildDest = 'build/',
    jsFiles = ['src/*.js'],
    uglifyOptions = {
        output: {
            comments: 'some'
        }
    };

gulp.task('default', function(cb) {
    pump([
        gulp.src(jsFiles),
        sourcemaps.init(),
        uglify(uglifyOptions),
        rename({ suffix: '.min' }),
        sourcemaps.write('./'),
        gulp.dest(buildDest)
    ],
    cb);
});
