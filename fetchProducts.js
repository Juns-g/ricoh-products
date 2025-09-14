import fetch from 'node-fetch'
import fs from 'fs'
import { sendMail } from './sendMail.js'
import { getHeaders } from './token.js'

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

    const grDom = grList.map(item => getProductTemplate(item)).join('')

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
        ${grDom}
      </div>
    </body>
    </html>
    `

    fs.mkdirSync('dist', { recursive: true })
    fs.writeFileSync('dist/index.html', html, 'utf-8')

    if (grList?.length) {
      await sendMail('理光GR有货了', grDom)
    }
  } catch (e) {
    console.error('error:', e)
    process.exit(1)
  }
}

main()
