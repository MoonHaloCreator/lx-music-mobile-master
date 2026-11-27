import { httpGet } from '@/utils/request'
import { downloadFile, stopDownload, temporaryDirectoryPath } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

const REPO_OWNER = 'MoonHaloCreator'
const REPO_NAME = 'lx-music-mobile-master'
const APK_PREFIX = 'MeloRiver'

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

const address = [
  [`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`, 'github_release'],
  [`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=1`, 'github_releases_list'],
  [`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/publish/version.json`, 'direct'],
  [`https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@master/publish/version.json`, 'direct'],
  [`https://fastly.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@master/publish/version.json`, 'direct'],
  [`https://gcore.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@master/publish/version.json`, 'direct'],
]


const request = async(url, retryNum = 0) => {
  return new Promise((resolve, reject) => {
    httpGet(url, {
      timeout: 10000,
    }, (err, resp, body) => {
      if (err || resp.statusCode != 200) {
        ++retryNum >= 3
          ? reject(err || new Error(resp.statusMessage || resp.statusCode))
          : request(url, retryNum).then(resolve).catch(reject)
      } else resolve(body)
    })
  })
}

const getDirectInfo = async(url) => {
  return request(url).then(info => {
    if (info.version == null) throw new Error('failed')
    return info
  })
}

const getGithubReleaseInfo = async(url) => {
  return request(url).then(info => {
    if (!info || !info.tag_name) throw new Error('failed')
    return {
      version: String(info.tag_name).replace(/^v/i, ''),
      desc: info.body || '',
      history: [],
    }
  })
}

const getGithubReleasesListInfo = async(url) => {
  return request(url).then(list => {
    if (!Array.isArray(list) || !list.length || !list[0]?.tag_name) throw new Error('failed')
    const info = list[0]
    return {
      version: String(info.tag_name).replace(/^v/i, ''),
      desc: info.body || '',
      history: [],
    }
  })
}

export const getVersionInfo = async(index = 0) => {
  const [url, source] = address[index]
  let promise
  switch (source) {
    case 'direct':
      promise = getDirectInfo(url)
      break
    case 'github_release':
      promise = getGithubReleaseInfo(url)
      break
    case 'github_releases_list':
      promise = getGithubReleasesListInfo(url)
      break
  }

  return promise.catch(async(err) => {
    index++
    if (index >= address.length) throw err
    return getVersionInfo(index)
  })
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}
let downloadJobId = null
const noop = (total, download) => {}
let apkSavePath

export const downloadNewVersion = async(version, onDownload = noop) => {
  const abi = await getTargetAbi()
  const url = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v${version}/${APK_PREFIX}-v${version}-${abi}.apk`
  let savePath = temporaryDirectoryPath + '/MeloRiver.apk'

  if (downloadJobId) stopDownload(downloadJobId)

  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 20000,
    readTimeout: 30000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
      // switch (statusCode) {
      //   case 200:
      //   case 206:
      //     break
      //   default:
      //     onDownload(null, contentLength, 0)
      //     break
      // }
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then(() => {
    apkSavePath = savePath
    return updateApp()
  })
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
