const EventEmitter = require('events')
const chalk = require('chalk')
const execa = require('execa')
const readline = require('readline')
const registries = require('./registries')
const shouldUseTaobao = require('./shouldUseTaobao')

const taobaoDistURL = 'https://npm.taobao.org/dist'

const supportPackageManagerList = ['npm', 'yarn', 'pnpm']

const packageManagerConfig = {
  npm: {
    installDeps: ['install', '--loglevel', 'error'],
    installPackage: ['install', '--loglevel', 'error'],
    uninstallPackage: ['uninstall', '--loglevel', 'error'],
    updatePackage: ['update', '--loglevel', 'error']
  },

  pnpm: {
    installDeps: ['install', '--loglevel', 'error', '--shamefully-flatten'],
    installPackage: ['install', '--loglevel', 'error'],
    uninstallPackage: ['uninstall', '--loglevel', 'error'],
    updatePackage: ['update', '--loglevel', 'error']
  },

  yarn: {
    installDeps: [],
    installPackage: ['add'],
    uninstallPackage: ['remove'],
    updatePackage: ['upgrade']
  }
}

class InstallProgress extends EventEmitter {
  constructor() {
    super()

    this._progress = -1
  }

  get progress() {
    return this._progress
  }

  set progress(value) {
    this._progress = value
    this.emit('progress', value)
  }

  get enabled() {
    return this._progress !== -1
  }

  set enabled(value) {
    this.progress = value ? 0 : -1
  }

  log(value) {
    this.emit('log', value)
  }
}

const progress = (exports.progress = new InstallProgress())

function toStartOfLine(stream) {
  if (!chalk.supportsColor) {
    stream.write('\r')
    return
  }
  readline.cursorTo(stream, 0)
}

function checkPackageManagerIsSupported(command) {
  if (supportPackageManagerList.indexOf(command) === -1) {
    throw new Error(`Unknown package manager: ${command}`)
  }
}

function renderProgressBar(curr, total) {
  const ratio = Math.min(Math.max(curr / total, 0), 1)
  const bar = ` ${curr}/${total}`
  const availableSpace = Math.max(0, process.stderr.columns - bar.length - 3)
  const width = Math.min(total, availableSpace)
  const completeLength = Math.round(width * ratio)
  const complete = `#`.repeat(completeLength)
  const incomplete = `-`.repeat(width - completeLength)
  toStartOfLine(process.stderr)
  process.stderr.write(`[${complete}${incomplete}]${bar}`)
}

async function addRegistryToArgs(command, args, cliRegistry) {
  const altRegistry = cliRegistry || ((await shouldUseTaobao(command)) ? registries.taobao : null)

  if (altRegistry) {
    args.push(`--registry=${altRegistry}`)
    if (altRegistry === registries.taobao) {
      args.push(`--disturl=${taobaoDistURL}`)
    }
  }
}

function executeCommand(command, args, targetDir) {
  return new Promise((resolve, reject) => {
    progress.enabled = false

    const child = execa(command, args, {
      cwd: targetDir
      // stdio: ['inherit', 'inherit', 'inherit']
    })

    // filter out unwanted yarn output
    if (command === 'yarn') {
      child.stderr.on('data', buf => {
        const str = buf.toString()
        if (/warning/.test(str)) {
          return
        }

        // progress bar
        const progressBarMatch = str.match(/\[.*\] (\d+)\/(\d+)/)
        if (progressBarMatch) {
          // since yarn is in a child process, it's unable to get the width of
          // the terminal. reimplement the progress bar ourselves!
          renderProgressBar(progressBarMatch[1], progressBarMatch[2])
          return
        }

        process.stderr.write(buf)
      })
    }

    child.on('close', code => {
      if (code !== 0) {
        reject(`command failed: ${command} ${args.join(' ')}`)
        return
      }
      resolve()
    })
  })
}

exports.installDeps = async function installDeps(targetDir, command, cliRegistry) {
  checkPackageManagerIsSupported(command)

  const args = packageManagerConfig[command].installDeps

  await addRegistryToArgs(command, args, cliRegistry)
  await executeCommand(command, args, targetDir)
}

exports.installPackage = async function (targetDir, command, cliRegistry, packageName, dev = true) {
  checkPackageManagerIsSupported(command)

  const args = packageManagerConfig[command].installPackage

  if (dev) args.push('-D')

  await addRegistryToArgs(command, args, cliRegistry)

  args.push(packageName)

  debug(`command: `, command)
  debug(`args: `, args)

  await executeCommand(command, args, targetDir)
}

exports.uninstallPackage = async function (targetDir, command, cliRegistry, packageName) {
  checkPackageManagerIsSupported(command)

  const args = packageManagerConfig[command].uninstallPackage

  await addRegistryToArgs(command, args, cliRegistry)

  args.push(packageName)

  debug(`command: `, command)
  debug(`args: `, args)

  await executeCommand(command, args, targetDir)
}

exports.updatePackage = async function (targetDir, command, cliRegistry, packageName) {
  checkPackageManagerIsSupported(command)

  const args = packageManagerConfig[command].updatePackage

  await addRegistryToArgs(command, args, cliRegistry)

  packageName.split(' ').forEach(name => args.push(name))

  debug(`command: `, command)
  debug(`args: `, args)

  await executeCommand(command, args, targetDir)
}
