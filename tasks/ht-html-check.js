module.exports = function(grunt) {
  
	grunt.registerMultiTask('ht-html-check', 'Validate Handlebars templates ', function() {
		var fs = require('fs');
		var path = require('path');
		var files = this.files;
		var config = this.data;
		var countErrors = 0;
		var templateData = this.data.templateData;
		var partialsPath = this.data.partials;
		var partials = grunt.file.expand({filter: "isFile"}, [partialsPath]);
		var partialFiles = {};
		partials.forEach(function(file){
			var theFile = file.match(/\/([^/]*)$/)[1];
			var onlyName = theFile.replace(".handlebars","");
			partialFiles[onlyName] = onlyName;
		});

		var templateContent = {};
		templateData.forEach(function(file){
			try {
				var json = grunt.file.readJSON(file);
				templateContent[file] = {};
				for(var key in json){
					templateContent[file][key] = json[key];
				}
			}
			catch (e) {
				return grunt.fail.warn(e);
			}
			
		});
		
		var checkFile = function(file, filepath, index) {
			var data = grunt.file.read(filepath);
			
			var countOpen = (data.match(/\{\{/gmi) || []).length;
			var countClose = (data.match(/\}\}/gmi) || []).length;

			if(countOpen !== countClose){
				grunt.log.error('Error in File :' + filepath);
				grunt.log.writeln('Number of open Handlebars Variables does not match the number of closed handlebar variables');
				grunt.log.writeln("     ");
				countErrors++;
			}

			var definedLangVariables = data.match(/\{\{(lang[0-9A-z\ ]{0,100})\}\}/gmi);
			if(definedLangVariables != null){
				for(var pos in definedLangVariables){
					var variable = definedLangVariables[pos];
					var cleanedVariable = variable.replace("{{","").replace("}}","");
					for(var lang in templateContent){
						var languageFile = templateContent[lang];
						if(languageFile[cleanedVariable] == undefined){
							countErrors++;
							grunt.log.error('Error in File :' + filepath);
							grunt.log.writeln('Variable {{'+cleanedVariable+'}} is missing for Lang '+lang);
							grunt.log.writeln("     ");
						}
					}
				}
			}
			var definedPartials = data.match(/\{\{\>([0-9A-z\ ]{0,100})\}\}/gmi);
			if(definedPartials != null){

				definedPartials.forEach(function(variable){
					var cleanedVariable = variable.replace("{{","").replace("}}","").replace(">","");
					if(partialFiles[cleanedVariable] == undefined){
						countErrors++;
						grunt.log.error('Error in File :' + filepath);
						grunt.log.writeln('Partial {{>'+cleanedVariable+'}} is missing');
						grunt.log.writeln("     ");
					}
				});
			}

			var countOpen = (data.match(/\{\%/gmi) || []).length;
			var countClose = (data.match(/\%\}/gmi) || []).length;

			if(countOpen !== countClose){
				grunt.log.error('Error in File :' + filepath);
				grunt.log.writeln('Number of open Plentymarkets Variables does not match the number of closed Plentymarkets variables');
				grunt.log.writeln("     ");
				countErrors++;
			}
			var countOpen = (data.match(/(\{\% ?if(.*?) ?\%\})/gmi) || []).length;
			var countClose = (data.match(/(\{\% ?endif(.*?) ?\%\})/gmi) || []).length;

			if(countOpen !== countClose){
				grunt.log.error('Error in File :' + filepath);
				grunt.log.writeln('Number of open Plentymarkets IF / ENDIF does not match');
				grunt.log.writeln("     ");
				countErrors++;
			}
			
		}
		files.forEach(function(file) {
			if (Array.isArray(file.dest) && file.dest.length > file.src.length) {
				if (file.src.length > 1) {
					grunt.log.error('You may only have one source file when there are more destination files than source files.');
					return;
				} else {
					file.dest.forEach(function(destpath, index) {
						checkFile(file, file.src[0], index);
					});
				}
			} else {
				if (file.src.length > 0) {
					file.src.forEach(function(filepath, index) {
						checkFile(file, filepath, index);
					});
				} else {
					file.orig.src.forEach(function(template, index) {
						checkFile(file, template, index);
					});
				}
			}
		});
		if(countErrors >0){
			grunt.fail.warn("Task failed due to Errors");
		}
	});
}