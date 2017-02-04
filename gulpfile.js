var gulp = require('gulp');
var spawn = require('child_process').spawn;
var del = require('del');
var crisper = require('gulp-crisper');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');

gulp.copy = function(src,dest){
    return gulp.src(src, {base:"."})
        .pipe(gulp.dest(dest));
};

gulp.task('transpile-es2015', function () {
    return gulp.src(['src/**/*.{js,html}', '!bower_components/**/*'])
        .pipe(gulpif('*.html', crisper({scriptInHead:false}))) // Extract JS from .html files
        .pipe(sourcemaps.init())
        .pipe(gulpif('*.js', babel({
            presets: ['es2015']
        })))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('.tmp/src'));
        //.pipe(gulp.dest('dist/'));
});

/*
    Define build stages
 */

gulp.task('copy-temp', ['transpile-es2015'], function () {
    gulp.copy('test/**/*', '.tmp');
    gulp.copy('bower_components/**/*', '.tmp');
    gulp.copy('node_modules/**/*', '.tmp');
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