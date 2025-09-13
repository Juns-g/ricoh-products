import fetch from 'node-fetch'
import fs from 'fs'

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

/** token */
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
const getHeaders = async () => {
  const token = await getCachedToken()
  return {
    ...commonHeaders,
    authorization: `Bearer ${token}`,
    'authori-zation': `Bearer ${token}`,
    cookie: `auth._token.local1=Bearer%20${token}`,
  }
}

const getProducts = async () =>
  fetch(
    'https://newsite.ricn-mall.com/api/pc/get_products?page=1&limit=10&cid=9&sid=23&priceOrder=&news=0',
    {
      headers: await getHeaders(),
      body: null,
      method: 'GET',
    }
  ).then(res => res.json())

const getPcUrl = id => `https://newsite.ricn-mall.com/goods_detail/${id}`
const getH5Url = id =>
  `https://newsite.ricn-mall.com/pages/goods_details/index?id=${id}`

const getData = async () => {
  try {
    const res = await getProducts()
    if (!res || !res.data) {
      throw new Error('返回数据异常')
    }
    console.log(res)

    const { data } = res
    const allList = data.list.map(item => ({
      id: item.id,
      store_name: item.store_name,
      image: item.image,
      price: item.price,
      stock: item.stock,
      sales: item.sales,
      pcUrl: getPcUrl(item.id),
      h5Url: getH5Url(item.id),
    }))

    const grList = allList.filter(i => i.store_name.includes('GR'))
    return {
      allList,
      grList,
    }
  } catch (e) {
    console.log('请求失败', e)
    return {}
  }
}

const getProductTemplate = product => `
    <div class="item">
        <h3>${product.store_name}</h3>
        <img src="${product.image}"/>
        <p>价格: ${product.price}</p>
        <p>库存: ${product.stock}</p>
        <p>销量: ${product.sales}</p>
        <a href="${product.pcUrl}" target="_blank">PC页面</a>
        <a href="${product.h5Url}" target="_blank">H5页面</a>
    </div>
`

const main = async () => {
  try {
    const { allList, grList } = await getData()

    const html = `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
      <meta charset="UTF-8" />
      <title>商品列表</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .item { margin-bottom: 20px; }
        img { max-width: 200px; display: block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>最新商品（自动更新快照）</h1>
      <p>更新于：${new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      })}</p>
      <div>
        ${allList.map(item => getProductTemplate(item)).join('')}
      </div>
      <br/>
      <h2>GR系列</h2>
      <div>
        ${grList.map(item => getProductTemplate(item)).join('')}
      </div>
    </body>
    </html>
    `

    fs.mkdirSync('dist', { recursive: true })
    fs.writeFileSync('dist/index.html', html, 'utf-8')
  } catch (e) {
    console.error('error:', e)
    process.exit(1)
  }
}

main()
