const puppeteer = require("puppeteer")
const cheerio = require('cheerio')
const url = require('url')
const fs = require('fs')

let httpurl = "https://sobooks.net/xiaoshuowenxue"

  ; (async () => {
    const browser = await puppeteer.launch({
      headless: true
    })
    // await console.log('获取小说总数量');
    // const allNum = await getAllnum()
    // await console.log("分页数量读取完毕,数量为:" + allNum);

    await console.log('获取小说链接中')
    const bookUrls = []
    for(let i=1; i<=1; i++) {
      const urls = await getFictionUrl(i)
      bookUrls.push(...urls)
    }
    await console.log('获取小说链接完毕，共有：' + bookUrls.length)

    let content = ''
    for(let i=0; i<bookUrls.length; i++) {
      const info = await getFictionInfo(bookUrls[i])
      if(content !== '') {
        content += ',' + info
      }else {
        content += info
      }
    }
    content = '[' + content + ']'

    fs.writeFileSync(`./book/book.json`, content, {
      flag: 'a'
    })
    

    async function getAllnum () {
      const page = await getPage()

      await page.goto(httpurl) //前往目标地址

      const allNum = await page.$eval('.pagination li:last-child span', (e) => {
        const num = e.textContent.substring(1, e.textContent.length - 2).trim()
        return Number(num)
      })

      page.close()

      return allNum
    }

    async function getFictionUrl (idx) {
      const pageUrl = `https://sobooks.net/xiaoshuowenxue/page/${idx}`
      const page = await getPage()
      await page.goto(pageUrl)
      const urls = await page.$$eval('.card .card-item h3>a', (elements) => {
        const arr = []
        for (let ele of elements) {
          arr.push(ele.getAttribute('href'))
        }
        return arr
      })
      page.close()

      return urls
    }

    async function getFictionInfo (bookUrl) {
      const page = await getPage()
      await page.goto(bookUrl)
      const html = await page.content()
      $ = cheerio.load(html)

      const bookinfo = {}
      $('.bookinfo ul li').each(function (i) {
        let tag = ''
        if (i == 0) {
          tag = 'title'
        }
        if (i == 1) {
          tag = "author"
        }
        if (i == 2) {
          tag = "saw"
        }
        if (i == 3) {
          tag = "tag"
        }
        if (i == 4) {
          tag = "time"
        }
        if (i == 5) {
          tag = "star"
        }
        if (i == 6) {
          tag = "ISBN"
        }
        const info = $(this).text().slice(3, $(this).text().length).trim() || "0"
        bookinfo[tag] = info
      })

      let auther_content = []
      let novel_content = []
      let tab = "1"//标记
      let content = $('.article-content>p,.article-content>h2').each(function (i) {
        let text1 = "内容简介"
        let text2 = "作者简介"
        let text = $(this).text()
        if (text == text1) {
          tab = text1
        }else if (text == text2) {
          tab = text2
        }else {
          if (tab == text1) {
            novel_content.push(text)
          }
          else {
            auther_content.push(text)
          }
        }

      })
      bookinfo['auther_content'] = auther_content
      bookinfo['novel_content'] = novel_content

      const img = $('.bookpic img').attr('src')
      bookinfo['img'] = img
      const info = JSON.stringify(bookinfo)

      page.close()

      return info
    }

    function getPage () {
      return new Promise(async (resolve) => {
        const page = await browser.newPage()
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
        await page.setRequestInterception(true)
        await page.on('request', Interception => {
          const urlobj = url.parse(Interception.url())
          if (urlobj.hostname == 'googleads.g.doubleclick.net') {
            Interception.abort()
          } else {
            Interception.continue()
          }
        })

        resolve(page)
      })
    }

  })();


