const { dest, parallel, series, src, watch } = require('gulp');

const gulpClean = require('gulp-clean');
const gulpYaml = require('gulp-yaml');

function clean() {
	return src([
		'public/lang/',
		'public/system.json',
		'public/template.json',
	], {allowEmpty: true})
		.pipe(gulpClean());
}

function buildData() {
	return src('yaml/**/*.yml')
		.pipe(gulpYaml())
		.pipe(dest('public/'));
}

function watchDirs() {
	watch('yaml/**/*.yml', buildData);
}

exports.clean = clean;
exports.data = buildData;
exports.watch = series(clean, buildData, watchDirs);

exports.default = series(clean, buildData);
