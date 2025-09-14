import fetch from 'node-fetch'

// 从环境变量读取账号密码
const PHONE = process.env.SITE_PHONE
const PASSWORD = process.env.SITE_PASSWORD

const commonHeaders = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'zh-CN,zh;q=0.9',
  'cache-control': 'no-cache',
  'content-type': 'application/json',
  'form-type': 'pc',
  pragma: 'no-cache',
  priority: 'u=1, i',
  'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'sec-gpc': '1',
}

async function getToken() {
  const res = await fetch('https://newsite.ricn-mall.com/api/login', {
    method: 'POST',
    headers: commonHeaders,
    referrer: 'https://newsite.ricn-mall.com/login',
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({
      account: PHONE,
      password: PASSWORD,
    }),
  }).then(r => r.json())

  if (!res || !res.data) {
    throw new Error(`Login failed: ${res.status} ${res.msg}`)
  }

  return res.data // {token, expires_time}
}

const tokenCache = {}

const getCachedToken = async () => {
  if (tokenCache.token && Date.now() < tokenCache.expires_time - 60000) {
    return tokenCache.token
  }
  const tokenData = await getToken()
  tokenCache.token = tokenData.token
  tokenCache.expires_time = tokenData.expires_time
  return tokenCache.token
}

export const getHeaders = async () => {
  const token = await getCachedToken()
  return {
    ...commonHeaders,
    authorization: `Bearer ${token}`,
    'authori-zation': `Bearer ${token}`,
    cookie: `auth._token.local1=Bearer%20${token}`,
  }
}
