import gulp from "gulp";
import ts from "gulp-typescript";
// @ts-ignore
import clean from "gulp-clean";
import fs from "fs";

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', function () {
	return gulp.src('dist/dev', {read: false, allowEmpty: true})
		.pipe(clean());
});

gulp.task('scripts', () => {
	if (!fs.existsSync("dist/dev")) {
		fs.mkdirSync("dist/dev", { recursive: true });
	}
	const tsResult = tsProject.src()
		.pipe(tsProject());

	const jsFiles = gulp.src(['src/electron/**/*.js', 'src/electron/**/*.cjs']);

	return tsResult.js
		.pipe(gulp.dest('dist/dev'))
		.on('end', () => {
			jsFiles.pipe(gulp.dest('dist/dev'));
		});
});

gulp.task('assets', () => {
	return gulp.src('src/electron/assets/**/*', { encoding: false })
		.pipe(gulp.dest('dist/dev/assets'));
});

gulp.task('binary', () => {
	return gulp.src('bin/**/*', { encoding: false })
		.pipe(gulp.dest('dist/dev/bin'));
});

gulp.task("locales", () => {
	return gulp.src('i18n/**/*')
	    .pipe(gulp.dest('dist/dev/i18n'));
})

gulp.task('build', gulp.series('clean', 'scripts', 'assets', 'binary', 'locales'));