const fs = require('fs-extra')

const remotePresetMap = {
  react: 'jibenziliao/vite-react-ts-template'
}

module.exports = async function (name, targetDir, clone) {
  const os = require('os')
  const path = require('path')
  const gitly = require('gitly')
  const tmpdir = path.join(os.tmpdir(), '@jibenziliao/create-vite-react-ts')

  // clone will fail if tmpdir already exists
  // https://github.com/flipxfx/download-git-repo/issues/41
  // if (clone) {
  //   await fs.remove(tmpdir)
  // }

  await fs.remove(tmpdir)

  await new Promise((resolve, reject) => {
    // 这里可以根据具体的模板地址设置下载的url，注意，如果是git，url后面的branch不能忽略
    gitly(remotePresetMap[name], tmpdir).then(() => resolve()).catch(err => {
      return reject(err)
    })
  })

  return {
    targetDir,
    tmpdir
  }
}
