#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const os = require('os')
const opn = require('opn')

const program = require('commander')
const inquirer = require('inquirer')

const src2img = require('src2img')
const filename2prism = require('filename2prism')

const configPath = path.join(os.homedir(), '.src2img')
const config = (() => {
  let json
  return () => json ? Promise.resolve(json) : fs.readJson(configPath).then(a => {
    json = a
    return json
  }, () => fs.outputJson(configPath, {}).then(() => {}))
})()

program.version(path.join(__dirname, 'package.json').version)

program
  .command('render <filenames...>')
  .description('converts source code to high quality images')
  .option('-o, --out <dir>', 'specifies an output directory', '.')
  .option('-t, --type <type>', 'specifies an output file type (png or jpeg)', /^(png|jpeg)$/, 'png')
  .option('-n, --port <number>', 'specifies a port number', parseInt, 8888)
  .option('-p, --preset <name>', 'uses a preset')
  .action((filenames, opts) => {
    (opts.preset
      ? config().then(json => opts.preset in json
        ? json[opts.preset]
        : Promise.reject(new Error('the provided preset does not exist'))
      )
      : inquirer.prompt([
        {
          type: 'input',
          name: 'themePath',
          message: 'Theme',
          default: 'default'
        },
        {
          type: 'input',
          name: 'fontFamily',
          message: 'Font Family',
          default: 'default'
        },
        {
          type: 'input',
          name: 'fontSize',
          message: 'Font Size',
          default: '20',
          validate: answer => isNaN(parseFloat(answer)) ? 'the font size must be a number' : true,
          filter: answer => parseFloat(answer)
        },
        {
          type: 'input',
          name: 'fontSizeUnit',
          message: 'Font Size Unit',
          default: 'px',
          validate: answer => /^(cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/i.test(answer) ? true : 'invalid font size unit',
          filter: answer => answer.toLowerCase()
        },
        {
          type: 'input',
          name: 'padding',
          message: 'Padding',
          default: '20',
          validate: answer => isNaN(parseFloat(answer)) ? 'the padding must be a number' : true,
          filter: answer => parseFloat(answer)
        },
        {
          type: 'input',
          name: 'paddingUnit',
          message: 'Padding Unit',
          default: 'px',
          validate: answer => /^(cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/i.test(answer) ? true : 'invalid padding unit',
          filter: answer => answer.toLowerCase()
        },
        {
          type: 'confirm',
          name: 'transparent',
          message: 'Transparent Background',
          default: false
        },
        {
          type: 'input',
          name: 'background',
          message: 'Background',
          default: 'default',
          when: answers => !answers.transparent
        },
        {
          type: 'confirm',
          name: 'save',
          message: 'Save Preset',
          default: false
        }
      ]).then(answers => {
        if (answers.save) {
          return (function f () {
            return inquirer.prompt([{
              type: 'input',
              name: 'name',
              message: 'Preset Name'
            }]).then(({name}) =>
              config().then(json => {
                if (name in json) {
                  return inquirer.prompt([{
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'The provided preset name already exists. Overwrite?',
                    default: false
                  }]).then(({overwrite}) => {
                    if (overwrite) {
                      json[name] = answers
                      return fs.outputJson(configPath, json)
                    } else {
                      return inquirer.prompt([{
                        type: 'confirm',
                        name: 'change',
                        message: 'Choose a different preset name?',
                        default: false
                      }]).then(({change}) => {
                        if (change) {
                          return f()
                        }
                      })
                    }
                  })
                } else {
                  json[name] = answers
                  return fs.outputJson(configPath, json)
                }
              })
            )
          })().then(() => answers)
        } else {
          return answers
        }
      })
    ).then(answers => {
      ['themePath', 'fontFamily', 'background'].forEach(key => {
        if (key in answers && answers[key] === 'default') {
          delete answers[key]
        }
      })

      return Promise.all(filenames.map(filename => fs.readFile(filename)))
        .then(contents =>
          src2img(Object.assign({
            src: filenames.map((filename, i) => {
              let alias = filename2prism(filename)

              if (typeof alias === 'undefined') {
                alias = 'clike'
              } else if (Array.isArray(alias)) {
                alias = alias[0]
              }

              return [
                contents[i].toString(),
                alias
              ]
            }),
            type: opts.type,
            port: opts.port
          }, answers))
        ).then(images =>
          Promise.all(images.map((image, i) => {
            fs.outputFile(path.join(opts.out, `${path.basename(filenames[i])}.${opts.type}`), image)
          }))
        )
    }).catch(err => console.error(err.message))
  })

program
  .command('presets')
  .description('lists saved presets')
  .action(() =>
    config()
      .then(json => console.log(Object.keys(json).join('\n')))
      .catch(err => console.error(err.message))
  )

program
  .command('open')
  .description('opens the presets file')
  .action(() => opn(configPath, {wait: false}))

if (process.argv.slice(2).length === 0) {
  program.help()
}

program.parse(process.argv)
