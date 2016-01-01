'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var util = require('gulp-util');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var webserver = require('gulp-webserver');
var connect = require('gulp-connect');
var babel = require('gulp-babel');
var autoprefixer = require('gulp-autoprefixer');

var sourceFolder = './src';
var sassFolder = sourceFolder + '/scss';
var jsFolder = sourceFolder + '/js';

gulp.task('sass', function () {
    gulp.src(sassFolder + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('./dist/'))
        .pipe(connect.reload())
    ;
});

gulp.task('html', function () {
    gulp.src('index.html')
        .pipe(connect.reload())
    ;
});

gulp.task('js', function () {
    browserify(sourceFolder + "/app.js", {debug: true})
        //.add(require.resolve('babel/polyfill'))
        .transform(babelify)
        .bundle()
        .on('error', util.log.bind(util, 'Browserify Error'))
        .pipe(source("app.js"))
        .pipe(buffer())
        //.pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(uglify({mangle: false}))
        //.pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'))
        .pipe(connect.reload())
    ;

    //gulp.src(sourceFolder + '/app.js')
    //    .pipe(babel())
    //    .pipe(gulp.dest('./dist/'))
    //    .pipe(connect.reload())
    //;
})

gulp.task('watch', function () {
    //livereload.listen();
    gulp.watch('index.html', ['html']);
    gulp.watch(sassFolder + '/**/*.scss', ['sass']);
    gulp.watch(sourceFolder + '/**/*.js', ['js']);
});

gulp.task('connect', function () {
    connect.server({
        root: '.',
        livereload: true
    });
});


//gulp.task('webserver', function() {
//    gulp.src('app')
//        .pipe(webserver({
//            livereload: true,
//            directoryListing: true,
//            open: true
//        }));
//});
//
gulp.task('default', ['connect', 'watch']);