const fs = require('fs-extra')

const remotePresetMap = {
  react: 'jibenziliao/vite-react-ts-template'
}

module.exports = async function (name, targetDir, clone) {
  const os = require('os')
  const path = require('path')
  const download = require('@slimio/github')
  const to = require('await-to-js').default
  const tmpdir = path.join(os.tmpdir(), '@jibenziliao/create-vite-react-ts')

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  // if (clone) {
  //   await fs.remove(tmpdir)
  // }

  await fs.remove(tmpdir)

  await new Promise((resolve, reject) => {
    // 这里可以根据具体的模板地址设置下载的url
    const [err, res] = await to(download(remotePresetMap[name], { dest: tmpdir, extract: true }))
    if (err) {
      return reject(err)
    }
    resolve()
  })

  return {
    targetDir,
    tmpdir
  }
}
