import gulp from 'gulp';
const {dest, series, src} = gulp;

import gulpClean from 'gulp-clean';
import gulpYaml from 'gulp-yaml';

export function clean() {
	return src([
		'public/lang/',
		'public/system.json',
		'public/template.json',
	], {allowEmpty: true})
		.pipe(gulpClean());
}

export function data() {
	return src('yaml/**/*.yml')
		.pipe(gulpYaml())
		.pipe(dest('public/'));
}

function watchDirs() {
	gulp.watch('yaml/**/*.yml', data);
}

export const watch = series(clean, data, watchDirs);
export default series(clean, data);
