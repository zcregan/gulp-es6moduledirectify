var through = require('through2');
var path = require('path');
var File = require('vinyl');

module.exports = function () {
	var dictionary = Object.create(null);

	function bufferFiles(file, enc, cb) {
		var fileName = path.basename(file.path);
		var dirName = path.dirname(file.path);

		if (fileName == 'package.json') {
			//if not at base directory (we don't want to generate files outside of the base)
			if (file.relative != fileName) {
				dictionary[dirName] = dictionary[dirName] || {};
				dictionary[dirName].pjson = file;
			}
		} else if (fileName == 'index.js') {
			//if not at base directory (we don't want to generate files outside of the base)
			if (file.relative != fileName) {
				dictionary[dirName] = dictionary[dirName] || {};
				dictionary[dirName].index = file;
			}
		}

		this.push(file);
		cb();
	}

	function endStream(cb) {
		for (dirName in dictionary) {
			var newModule;
			var record = dictionary[dirName];

			if (record.pjson) {
				var mainVal = JSON.parse(record.pjson.contents.toString()).main;
				var importPath = path.basename(dirName) + '/' + mainVal;

				newModule = new File({
					cwd: record.pjson.cwd,
					base: record.pjson.base,
					path: dirName + '.js',
					contents: new Buffer('export * from \'' + importPath + '\';')
				});
			} else if (record.index) {
				var importPath = './' + path.basename(dirName) + '/index';

				newModule = new File({
					cwd: record.index.cwd,
					base: record.index.base,
					path: dirName + '.js',
					contents: new Buffer('export * from \'' + importPath + '\';')
				});
			}

			this.push(newModule);
		}

		cb();
	}

	return through.obj(bufferFiles, endStream);
}
