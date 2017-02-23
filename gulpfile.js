/* eslint-disable */

var gulp = require('gulp');
var spawn = require('child_process').spawn;
var del = require('del');
var crisper = require('gulp-crisper');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var gulpIgnore = require('gulp-ignore');

var PolymerProject = require('polymer-build').PolymerProject;
var mergeStream = require('merge-stream');
var HtmlSplitter = require('polymer-build').HtmlSplitter;

var sourcesHtmlSplitter = new HtmlSplitter();

var project = new PolymerProject(require('./polymer.json'));

var generateServiceWorker = require('polymer-build').generateServiceWorker;
var addServiceWorker = require('polymer-build').addServiceWorker;

var isWin = /^win/.test(process.platform);
function waitFor(stream) {
    return new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}

gulp.spawnCmd = function (command) {
    if (isWin){
        return command + ".cmd";
    } else {
        return command;
    }
};

gulp.copy = function(src, dest){
    return gulp.src(src, {base:"."})
        .pipe(gulp.dest(dest));
};
gulp.copyBase = function(src, dest, base){
    return gulp.src(src, {base: base})
        .pipe(gulp.dest(dest));
};
gulp.buildSources = function (sources) {
    return project.sources()
        .pipe(sourcesHtmlSplitter.split()) // split inline JS & CSS out into individual .js & .css files
        .pipe(sourcemaps.init())
        .pipe(gulpif('*.js', babel({
            presets: ['es2015']
        })))
        .pipe(sourcemaps.write())
        .pipe(sourcesHtmlSplitter.rejoin());
};

gulp.task('transpile-es2015', [], function () {
    return gulp.src(['src/**/*.{js,html}', '!bower_components/**/*'])
        .pipe(sourcesHtmlSplitter.split()) // split inline JS & CSS out into individual .js & .css files
        .pipe(sourcemaps.init())
        .pipe(gulpif('*.js', babel({
            presets: ['es2015']
        })))
        .pipe(sourcemaps.write())
        .pipe(sourcesHtmlSplitter.rejoin()) // rejoins those files back into their original location
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
    gulp.copy('firebase-messaging-sw.js', '.tmp');
    gulp.copy('sw-precache-config.js', '.tmp');
    gulp.copy('images/**/*', '.tmp');
});

gulp.task('test-exec', ['copy-temp'], function (onComplete) {
    spawn(gulp.spawnCmd('polymer'), ['test'], { cwd: '.tmp/', stdio: 'inherit' })
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
    spawn(gulp.spawnCmd('polymer'), ['serve', '--open', '.'], { cwd: '.tmp/', stdio: 'inherit' })
        .on('close', function (){
        }).on('error', function (error) {
        onComplete(error);
    });
    gulp.watch('src/**/*', ['copy-temp']);
});


function writeBundledServiceWorker(project, swPreCache) {
    // On windows if we pass the path with back slashes the sw-precache node module is not going
    // to strip the build/bundled or build/unbundled because the path was passed in with backslash.
    return addServiceWorker({
        project: project,
        buildRoot: 'production-build/',
        swPrecacheConfig: swPreCache,
        bundled: true
    });
}

gulp.task('build', [], function (onComplete) {
    var stream = mergeStream(gulp.buildSources(project.sources()), project.dependencies());
    console.log("Sources Merged");

    stream = stream.pipe(project.bundler);
    console.log("BUNDLING");
    stream = stream.pipe(gulp.dest('production-build/'));
    waitFor(stream).then(function () {
        var swPreCache = require('./sw-precache-config.js');
        console.log(swPreCache);
        writeBundledServiceWorker(project, swPreCache).then(() => {
            console.log("SW-Generated");
            console.log("Build Complete!");
            onComplete();
        });
    });
});