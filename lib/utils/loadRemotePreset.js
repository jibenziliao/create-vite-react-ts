const fs = require('fs-extra')

const remotePresetMap = {
  react: 'https://github.com/jibenziliao/vite-react-ts-template'
}

module.exports = async function (name, targetDir, clone) {
  const os = require('os')
  const path = require('path')
  const shell = require('shelljs')
  const tmpdir = path.join(os.tmpdir(), '@jibenziliao/create-vite-react-ts')

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  // if (clone) {
  //   await fs.remove(tmpdir)
  // }

  await fs.remove(tmpdir)

  await new Promise(async (resolve, reject) => {
    if (!shell.which('git')) {
      const err = new Error('Sorry, this script requires git'')
      shell.echo(err.message)
      shell.exit(1)
      reject(err)
    } else {
      shell.exec(`git clone https://github.com/${remotePresetMap[name]}.git`)
      resolve()
    }
  })

  return {
    targetDir,
    tmpdir
  }
}
