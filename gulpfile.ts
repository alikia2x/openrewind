import gulp from "gulp";
import ts from "gulp-typescript";
// @ts-ignore
import clean from "gulp-clean";

const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', function () {
	return gulp.src('dist/dev', {read: false, allowEmpty: true})
		.pipe(clean());
});

gulp.task('scripts', () => {
	const tsResult = tsProject.src()
		.pipe(tsProject());
	return tsResult.js.pipe(gulp.dest('dist/dev'));
});

gulp.task('assets', () => {
	return gulp.src('src/electron/assets/**/*')
		.pipe(gulp.dest('dist/dev/assets'));
});

gulp.task("locales", () => {
	return gulp.src('i18n/**/*')
	    .pipe(gulp.dest('dist/dev/i18n'));
})

gulp.task('build', gulp.series('clean', 'scripts', 'assets', 'locales'));