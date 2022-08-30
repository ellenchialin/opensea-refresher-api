// const puppeteer = require('puppeteer-core')
const chromium = require('chrome-aws-lambda')

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const contractAddress = req.body.contractAddress
    const tokenId = req.body.tokenId

    const path =
      process.env.NODE_ENV === 'dev'
        ? {
            executablePath:
              process.platform === 'win32'
                ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
                : process.platform === 'linux'
                ? '/usr/bin/google-chrome'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          }
        : {
            executablePath: await chromium.executablePath
          }

    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      path,
      headless: true,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions']
    })

    console.log('Launching new page...')
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
    )

    try {
      console.log('Going to Opensea...')
      await page.goto(
        `https://testnets.opensea.io/assets/rinkeby/${contractAddress}/${tokenId}`
      )

      await pause(1000)
      // await page.click('[value="refresh"]')
      const title = await page.title()

      console.log(`Token ${tokenId} finished and ready to close browser...`)
      browser.close()

      res.status(200).json({ message: 'Ok', title })
    } catch (error) {
      console.dir(error)
      res.status(500).json({ message: `Something went wrong! ${error}` })
    }
  } else {
    res
      .status(500)
      .json({ message: 'Please use POST method to call this refresh api' })
  }
}
