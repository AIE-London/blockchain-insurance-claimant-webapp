/* eslint-disable */

var gulp = require('gulp');
var spawn = require('child_process').spawn;
var del = require('del');
var crisper = require('gulp-crisper');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');

gulp.copy = function(src, dest){
    return gulp.src(src, {base:"."})
        .pipe(gulp.dest(dest));
};
gulp.copyBase = function(src, dest, base){
    return gulp.src(src, {base: base})
        .pipe(gulp.dest(dest));
};

gulp.task('transpile-es2015', [], function () {
    return gulp.src(['src/**/*.{js,html}', '!bower_components/**/*'])
        .pipe(gulpif('*.html', crisper({scriptInHead:false}))) // Extract JS from .html files
        .pipe(sourcemaps.init())
        .pipe(gulpif('*.js', babel({
            presets: ['es2015']
        })))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('.tmp/src'));
});

/*
    Define build stages
 */

gulp.task('copy-temp', ['transpile-es2015'], function () {
    gulp.copy('test/**/*', '.tmp');
    gulp.copy('bower_components/**/*', '.tmp');
    gulp.copy('node_modules/**/*', '.tmp');
    gulp.copy('index.html', '.tmp');
    gulp.copy('bower.json', '.tmp');
    gulp.copy('package.json', '.tmp');
    gulp.copy('polymer.json', '.tmp');
    gulp.copy('manifest.json', '.tmp');
    gulp.copy('service-worker.js', '.tmp');
    gulp.copy('sw-precache-config.js', '.tmp');
    gulp.copy('images/**/*', '.tmp');
});

gulp.task('test-exec', ['copy-temp'], function (onComplete) {
    spawn('polymer', ['test'], { cwd: '.tmp/', stdio: 'inherit' })
        .on('close', function (){
            onComplete(null);
        }).on('error', function (error) {
            onComplete(error);
        });
});

gulp.task('test', ['test-exec'], function () {
    del(['.tmp/']);
});

gulp.task('clean', function () {
    del(['.tmp/']);
    del(['dist/']);
});

gulp.task('serve', ['copy-temp'], function (onComplete) {
    spawn('polymer', ['serve', '--open', '.'], { cwd: '.tmp/', stdio: 'inherit' })
        .on('close', function (){
        }).on('error', function (error) {
        onComplete(error);
    });
    gulp.watch('src/**/*', ['copy-temp']);
});


gulp.task('build', ['copy-temp'], function (onComplete) {
    setTimeout(function () {
        spawn('polymer', ['build'], { cwd: '.tmp/', stdio: 'inherit' })
            .on('close', function (){
                gulp.copyBase('.tmp/build/**/*', 'dist', '.tmp/build');
                gulp.copyBase('.tmp/package.json', 'dist/bundled', '.tmp');
                gulp.copyBase('.tmp/package.json', 'dist/unbundled', '.tmp');
                onComplete();
            }).on('error', function (error) {
            onComplete("ERROR");
        });
    }, 1000);
});