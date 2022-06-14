const puppeteer = require("puppeteer")
const cheerio = require('cheerio')
const url = require('url')
const fs = require('fs')

let httpurl = "https://www.zhhbqg.com/75025_75025307/"

  ; (async () => {
    const browser = await puppeteer.launch({
      headless: true
    })

    await console.log('获取小说链接中')
    const bookUrls = []

    const chapterUrls = await getFictionUrl()
    await console.log(chapterUrls)

    let content = ''
    for(let i=0; i<20; i++) {
      const chapter = await getChapterInfo(chapterUrls[i])
      content += chapter
    }

    fs.writeFileSync(`./book/开局签到.txt`, content, {
      flag: 'w'
    })
    

    async function getFictionUrl () {
      const pageUrl = `https://www.zhhbqg.com/75025_75025307/`
      const page = await getPage()
      await page.goto(pageUrl)
      const urls = await page.$$eval('.listmain dl>dd:nth-child(n+14) a', (elements) => {
        const arr = []
        for (let ele of elements) {
          arr.push('https://www.zhhbqg.com' + ele.getAttribute('href'))
        }
        return arr
      })
      page.close()

      return urls
    }

    async function getChapterInfo(path) {
      const page = await getPage()
      await page.goto(path)
      const html = await page.content()
      $ = cheerio.load(html)

      const len = $('.showtxt').text().length
      const content = $('.showtxt').text().substring(83, len - 232)

      page.close()

      return content
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


