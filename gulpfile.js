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

const generateServiceWorker = require('polymer-build').generateServiceWorker;


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


gulp.task('build', [], function (onComplete) {
    var stream = mergeStream(gulp.buildSources(project.sources()), project.dependencies());
    console.log("Sources Merged");

    stream = stream.pipe(project.bundler);
    console.log("BUNDLING");
    stream.pipe(gulp.dest('production-build/'));
    waitFor(stream).then(function () {
        generateServiceWorker({
            buildRoot: 'production-build/',
            project: project,
            bundled: true, // set if `project.bundler` was used
            swPrecacheConfig: require('./sw-precache-config.js')
        }).then(() => {
            console.log("SW-Generated");
            onComplete();
        });
    });
});