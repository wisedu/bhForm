var gulp = require('gulp');
// var del = require('del');
var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var fs = require('fs');
// var exec = require('child_process').exec;
// var plumber = require('gulp-plumber');
// var os = require('os');
var gLess = require('gulp-less');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');

const cssPath = './src/layout/*.less';
const jsPath = ['./src/validate/*.js', './src/*.js'];


gulp.task('buildcss', function () {
  gulp.src(cssPath)
    .pipe(plumber())
    .pipe(gLess())
    .pipe(concat('bhForm.css'))
    .pipe(gulp.dest('./dist/'))
})

gulp.task('buildjs', function () {
  gulp.src(jsPath)
    .pipe(plumber())
    .pipe(concat('bhForm.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./dist/'))
})
gulp.task('watch', ['buildcss', 'buildjs'], function () {
  gulp.watch(cssPath, ['buildcss'])
  gulp.watch(jsPath, ['buildjs'])
})

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: ""
    },
    open: false
  });
});

gulp.task('default', ['watch', 'serve']);

/**** 

gulp.task('watch', ['buildEmap-V1.2'], function () {
  gulp.watch(emapPluginPath.concat(emapPluginPath_V1_2), ['buildEmap-V1.2'])
});


gulp.task('buildEmap', function () {
  gulp.src(emapPluginPath)
    .pipe(plumber())
    .pipe(concat('emap.js'))
    .pipe(gulp.dest(rootPath + 'emap/'))
    .pipe(concat('emap.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(rootPath + 'emap/'))
});

gulp.task('buildEmap-V1.2', ['buildEmap'], function () {
  gulp.src(emapPluginPath_V1_2)
    .pipe(plumber())
    .pipe(concat('emap-1.2.js'))
    .pipe(gulp.dest(rootPath + 'emap/'))
    .pipe(concat('emap-1.2.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(rootPath + 'emap/'))
});


gulp.task('cleanEmap', function (callback) {
  del([rootPath + 'emap'], callback);
});


gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: "./app"
    },
    open: false
  });
});

//编译jsdoc
gulp.task('jsdoc', function () {
  var binaryEncoding = 'binary';
  var isWindowsOs = /windows/i.test(os.type());

  exec((isWindowsOs ? 'call ' : '') + './node_modules/.bin/jsdoc -c jsdoc-config.json -r -t ./jstpl -u ./tutorial', {
    encoding: binaryEncoding
  }, function (err, stdout, stderr) {
    if (err) {
      console.log('jsdoc 出错了:' + (new Buffer(stderr, binaryEncoding)).toString());
    } else {
      console.log('jsdoc-1.1 创建完成了 !');
    }
  });

  exec((isWindowsOs ? 'call ' : '') + './node_modules/.bin/jsdoc -c jsdoc-config-1.2.json -r -t ./jstpl', {
    encoding: binaryEncoding
  }, function (err, stdout, stderr) {
    if (err) {
      console.log('jsdoc 出错了:' + (new Buffer(stderr, binaryEncoding)).toString());
    } else {
      console.log('jsdoc-1.2 创建完成了 !');
    }
  });
});

gulp.task('default', ['watch', 'serve']);
*/