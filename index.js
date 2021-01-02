#!/usr/bin/env node
import { basename, join, resolve } from 'path'
import os from 'os'
import fs from 'fs-extra'
import open from 'open'
import program from 'commander'
import inquirer from 'inquirer'
import src2img from 'src2img'
import filename2prism from 'filename2prism'

const configPath = join(os.homedir(), `.src2img`)
const config = async () => {
  try {
    return await fs.readJson(configPath)
  } catch {
    await fs.outputJson(configPath, {})
    return {}
  }
}

program.name(`src2img`)

program
  .command(`render <filenames...>`)
  .description(`converts source code to high quality images`)
  .option(`-o, --out <dir>`, `specifies an output directory`, `.`)
  .option(
    `-t, --type <type>`,
    `specifies an output file type (png or jpeg)`,
    /^(?:png|jpeg)$/u,
    `png`
  )
  .option(`-n, --port <number>`, `specifies a port number`, parseInt, 8888)
  .option(`-p, --preset <name>`, `uses a preset`)
  .action(async (filenames, { out, type, port, preset }) => {
    const json = await config()

    let answers
    if (!preset) {
      answers = await inquirer.prompt([
        {
          type: `input`,
          name: `themePath`,
          message: `Theme`,
          default: `default`
        },
        {
          type: `input`,
          name: `fontFamily`,
          message: `Font Family`,
          default: `default`
        },
        {
          type: `input`,
          name: `fontSize`,
          message: `Font Size`,
          default: `20`,
          validate: answer =>
            isNaN(parseFloat(answer)) ? `the font size must be a number` : true,
          filter: answer => parseFloat(answer)
        },
        {
          type: `input`,
          name: `fontSizeUnit`,
          message: `Font Size Unit`,
          default: `px`,
          validate: answer =>
            /^(?:cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/iu.test(
              answer
            )
              ? true
              : `invalid font size unit`,
          filter: answer => answer.toLowerCase()
        },
        {
          type: `input`,
          name: `padding`,
          message: `Padding`,
          default: `20`,
          validate: answer =>
            isNaN(parseFloat(answer)) ? `the padding must be a number` : true,
          filter: answer => parseFloat(answer)
        },
        {
          type: `input`,
          name: `paddingUnit`,
          message: `Padding Unit`,
          default: `px`,
          validate: answer =>
            /^(?:cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/iu.test(
              answer
            )
              ? true
              : `invalid padding unit`,
          filter: answer => answer.toLowerCase()
        },
        {
          type: `confirm`,
          name: `transparent`,
          message: `Transparent Background`,
          default: false
        },
        {
          type: `input`,
          name: `background`,
          message: `Background`,
          default: `default`,
          when: ({ transparent }) => !transparent
        },
        {
          type: `confirm`,
          name: `save`,
          message: `Save Preset`,
          default: false
        }
      ])

      if (answers.save) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const name = await inquirer.prompt([
            {
              type: `input`,
              name: `name`,
              message: `Preset Name`
            }
          ])

          if (!(name in json)) {
            json[name] = answers
            await fs.outputJson(configPath, json)
            break
          }
          const { overwrite } = await inquirer.prompt([
            {
              type: `confirm`,
              name: `overwrite`,
              message: `The provided preset name already exists. Overwrite?`,
              default: false
            }
          ])

          if (overwrite) {
            json[name] = answers
            await fs.outputJson(configPath, json)
            break
          }

          const { change } = await inquirer.prompt([
            {
              type: `confirm`,
              name: `change`,
              message: `Choose a different preset name?`,
              default: false
            }
          ])

          if (!change) {
            break
          }
        }
      }
    } else if (preset in json) {
      answers = json[preset]
    } else {
      throw new Error(`the provided preset does not exist`)
    }

    ;[`themePath`, `fontFamily`, `background`].forEach(key => {
      if (answers[key] === `default`) {
        answers[key] = undefined
      }
    })

    if (typeof answers.themePath !== `undefined`) {
      answers.themePath = resolve(answers.themePath)
    }

    const contents = await Promise.all(
      filenames.map(filename => fs.readFile(filename))
    )
    const images = await src2img({
      srcs: filenames.map((filename, i) => {
        let alias = filename2prism(filename)

        if (typeof alias === `undefined`) {
          alias = `clike`
        } else if (Array.isArray(alias)) {
          alias = alias[0]
        }

        return [contents[i].toString(), alias]
      }),
      type,
      port,
      ...answers
    })

    await Promise.all(
      images.map((image, i) =>
        fs.outputFile(join(out, `${basename(filenames[i])}.${type}`), image)
      )
    )
  })

program
  .command(`presets`)
  .description(`lists saved presets`)
  .action(async () => {
    const json = await config()
    console.log(Object.keys(json).join(`\n`))
  })

program
  .command(`open`)
  .description(`opens the presets file`)
  .action(() => open(configPath, { wait: false }))

if (process.argv.slice(2).length === 0) {
  program.help()
}

program.parse(process.argv)
