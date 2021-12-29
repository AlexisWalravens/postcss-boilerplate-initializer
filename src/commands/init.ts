import chalk from 'chalk'
// import inquirer from 'inquirer'
import prompts from 'prompts'
import path from 'path'
import { execa } from 'execa'
import fs from 'fs-extra'
import Listr from 'listr'
import boxen from 'boxen'

const projectRoot = process.cwd()
const currentFileUrl = import.meta.url
const cliRoot = path.resolve(
  new URL(currentFileUrl).pathname,
  '../../../'
)

const checkIfFileExists = async (fileName: string) => {
  const filePath = path.resolve(projectRoot, fileName)
  return await fs.pathExists(filePath)
}

type replaceArray = [string, string][]

const copyConfigFile = async (
  templateFileName: string,
  fileName: string,
  replaceArray?: replaceArray
) => {
  const templatefilePath = path.resolve(cliRoot, 'src/templates', templateFileName)
  const fileExists = await checkIfFileExists(fileName)

  const file = await fs.readFile(templatefilePath, 'utf8')

  if (!fileExists) {
    let fileFilled = file

    replaceArray && replaceArray.forEach(([search, replace]) => {
      fileFilled = file.replaceAll(search, replace)
    })

    await fs.writeFile(fileName, fileFilled, 'utf8')
  } else {
    throw new Error(`${fileName} already exists.`)
  }
}

const copyDirectory = async (destination: string) => {
  await fs.ensureDir(destination)

  const directoryToCopy = path.resolve(
    cliRoot,
    'src/styles'
  )

  try {
    await fs.copy(directoryToCopy, destination)

    return true
  } catch (err) {
    throw new Error('An error occured while copying the folder, aborting.')
  }
}

const addRequiredPackages = async ({ stylelint }: { stylelint?: boolean }) => {
  const yarnLockExists = await checkIfFileExists('yarn.lock')

  const tool = yarnLockExists ? 'yarn' : 'npm'
  const command = yarnLockExists ? 'add' : 'install'

  const packages = ['style-dictionary', 'postcss-import', 'postcss-preset-env']

  if (stylelint) {
    const stylelintPackages = ['stylelint', 'stylelint-config-standard']
    packages.push(...stylelintPackages)
  }

  try {
    await execa(tool, [command, ...packages, '-D'], { cwd: projectRoot })
  } catch (error) {
    throw new Error('An error occured while installing style-dictionary.')
  }

  return true
}

const createPackageJson = async () => {
  try {
    await execa('npm', ['init', '-y'], { cwd: projectRoot })
    return true
  } catch (error) {
    throw new Error('An error occured while creating package.json.')
  }
}

const editPackageJson = async ({ stylelint }: { stylelint?: boolean }) => {
  const fileName = 'package.json'
  const packageJsonPath = path.resolve(projectRoot, fileName)

  try {
    const file = await fs.readJson(packageJsonPath)

    let generateScript =
      'style-dictionary build --config ./style-dictionary.config.json'

    if (stylelint) {
      generateScript += ' && npm run css:lint'
      file.scripts['css:lint'] = 'stylelint --fix ./**/*.css'
    }

    file.scripts['css:generate'] = generateScript

    if (!file.browerslist) {
      file.browserslist = ['> 3%', 'last 2 versions', 'not IE 11']
    }

    await fs.writeJson(packageJsonPath, file, { spaces: 2 })

    return true
  } catch (error) {
    console.log(error)
    throw new Error('An error occured while editing package.json.')
  }
}

const copyStyleDictionaryConfig = async (stylesDirectory: string) => {
  const templateFileName = 'style-dictionary.config.template.json'
  const fileName = 'style-dictionary.config.json'

  const replaceArray = [['%stylesDirectory%', stylesDirectory]] as replaceArray

  try {
    await copyConfigFile(templateFileName, fileName, replaceArray)
    return true
  } catch {
    throw new Error('An error occured while copying style-dictionnary config.')
  }
}

const copyPostCSSConfig = async (stylesDirectory: string) => {
  const templateFileName = 'postcss.config.template.js'
  const fileName = 'postcss.config.js'

  const replaceArray = [['%stylesDirectory%', stylesDirectory]] as replaceArray

  try {
    await copyConfigFile(templateFileName, fileName, replaceArray)
    return true
  } catch {
    throw new Error('An error occured while copying postcss config.')
  }
}

const copyStylelintConfig = async () => {
  const templateFileName = '.stylelintrc.template.json'
  const fileName = '.stylelintrc.json'

  try {
    await copyConfigFile(templateFileName, fileName)
    return true
  } catch (err) {
    throw new Error('An error occured while copying stylelint config.')
  }
}

const questions = [
  {
    type: 'text',
    name: 'stylesDirectory',
    message: 'Where is your styles directory located?',
    initial: 'assets/styles'
  },
  {
    type: 'toggle',
    name: 'postCSSConfig',
    message: 'Do you want to install the default PostCSS config?',
    initial: true,
    active: 'yes',
    inactive: 'no'
  },
  {
    type: 'toggle',
    name: 'stylelint',
    message: 'Do you want to install stylelint and its standard config?',
    initial: true,
    active: 'yes',
    inactive: 'no'
  }
]

async function init () {
  const { stylesDirectory, postCSSConfig, stylelint } = await prompts(questions)

  const destinationPath = path.resolve(projectRoot, stylesDirectory)

  const tasks = new Listr([
    {
      title: 'Copying styles directory',
      task: () => copyDirectory(destinationPath)
    },
    {
      title: 'Creating package.json',
      skip: async () => {
        const packageJsonExists = await checkIfFileExists('package.json')
        return packageJsonExists
          ? 'package.json already exists.'
          : false
      },
      task: () => createPackageJson()
    },
    {
      title: 'Installing required packages',
      task: () => addRequiredPackages({ stylelint })
    },
    {
      title: 'Copying PostCSS config',
      skip: () => postCSSConfig ? false : 'PostCSS config not needed.',
      task: () => copyPostCSSConfig(stylesDirectory)
    },
    {
      title: 'Copying style-dictionary config',
      task: () => copyStyleDictionaryConfig(stylesDirectory)
    },
    {
      title: 'Copying Stylelint config',
      skip: () => stylelint ? false : 'Stylelint not needed.',
      task: () => copyStylelintConfig()
    },
    {
      title: 'Adding script and browserslist to package.json',
      task: () => editPackageJson({ stylelint })
    }
  ])

  tasks.run().then(() => {
    const message = `
      You can now edit your variables in the json files under "${stylesDirectory}/tokens"!

      You can then run ${chalk.bold('"npm run css:generate"')} or ${chalk.bold('"yarn css:generate"')} to regenerate your variables.css.

      Don't forget to add ${stylesDirectory}/main.css as a global stylesheet.
    `

    console.log(boxen(message, {
      padding: 1,
      margin: 2,
      title: chalk.green.bold('Success!'),
      borderColor: 'green',
      borderStyle: 'round'
    }))
  }).catch((err) => {
    console.log(`\n${chalk.red(err)}`)
  })
}

export default init
