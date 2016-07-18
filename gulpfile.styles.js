/* eslint-env node */
"use strict";

let gulp = require("gulp");
let prefix = require("gulp-autoprefixer");
let sass = require("gulp-sass");
let sourcemaps = require("gulp-sourcemaps");
let rename = require("gulp-rename");

const config = {
  entryPoint: "index.scss",
  // sources: ["src/styles/**/*.scss"],
  target: {
    directory: "app/assets/stylesheets",
    filename: "application.css"
  },
  prefixes: "last 2 versions"
};

gulp.task("watch", () => {
  gulp.watch(config.sources, ["compile"]);
});

gulp.task("compile", () => gulp.
  src(config.entryPoint).
  pipe(sourcemaps.init()).
  pipe(sass().on("error", sass.logError)).
  pipe(prefix(config.prefixes)).
  pipe(rename(config.target.filename)).
  pipe(sourcemaps.write()).
  pipe(gulp.dest(config.target.directory)));
