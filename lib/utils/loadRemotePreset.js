const fs = require('fs-extra')

const remotePresetMap = {
  react: 'https://github.com/jibenziliao/vite-react-ts-template'
}

module.exports = async function (name, targetDir, clone) {
  const os = require('os')
  const path = require('path')
  const download = require('download-git-repo')
  const tmpdir = path.join(os.tmpdir(), '@jibenziliao/create-vite-react-ts')

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  // if (clone) {
  //   await fs.remove(tmpdir)
  // }

  await fs.remove(tmpdir)

  await new Promise(async (resolve, reject) => {
    // 这里可以根据具体的模板地址设置下载的url，注意，如果是git，url后面的branch不能忽略
    download(remotePresetMap[name], tmpdir, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })

  return {
    targetDir,
    tmpdir
  }
}
