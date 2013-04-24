module.exports = (grunt) ->

  fs = require 'fs'
  wrench = require 'wrench'

  build = require('consolidate-build')
  path = require('path')

  grunt.registerMultiTask 'build', 'Build scripts', ->
    files = grunt.file.expandFiles @data.src
    asyncDone = this.async()
    filesDone = 0
    done = ->
      filesDone++
      if filesDone is files.length
        asyncDone()

    errors = []

    destination = "#{fs.realpathSync('.')}/#{@data.dest}"

    clearOldDir = (callback) =>
      if @data.clear
        try
          wrench.rmdirSyncRecursive(destination, yes)
          console.log "Cleared old content (#{destination})" if @verbose
          callback()
        catch e
          console.log "Got an error trying to delete old dir (#{destination}). Trying again."
          errors.push description: 'remove old build-directory', error: e
          setTimeout (-> clearOldDir(callback)), 10

    clearOldDir =>

      for file in files
        do (file) =>

          extension = path.extname(file).substring(1)
          builder = grunt.utils._.find(build, (x) -> x.inExtension is extension)

          inExtension = builder?.inExtension ? extension
          outExtension = builder?.outExtension ? extension
          outFile = path.join destination, path.relative(@data.srcRoot, file[0...file.length-inExtension.length] + outExtension)

          directory = path.dirname(outFile)
          console.log directory if @verbose
          try
            wrench.mkdirSyncRecursive(directory, '0o0777')
          catch e
            errors.push description: 'creating new build-directory', error: e
            # do nothing
          
          if builder
            builderOptions = @data[inExtension] ? {}
            builder file, builderOptions, (err, output) ->
              writeContent = if err
                console.log "Error in #{file}", err
                "alert(\"#{file}\\n#{err}\");"
              else
                output

              fs.writeFile outFile, writeContent, ->
                done()
            console.log outFile if @verbose
          else
            inStr = fs.createReadStream(file)
            outStr = fs.createWriteStream(outFile)
            inStr.pipe(outStr)
            console.log outFile if @verbose
            done()

      if errors.length
        console.log "Got #{if errors.length is 1 then 'a error' else errors.length + ' errors'} compiling:"
        for error in errors
          console.log "when #{error.description}:"
          console.log "error: #{error.error}:"