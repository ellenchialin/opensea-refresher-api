const puppeteer = require('puppeteer-core')
const chromium = require('chrome-aws-lambda')

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  const contractAddress = '0x0f30dcafd0d8efedda13bad2da3bf30a3a336fc5'
  const tokenId = '0'

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath:
        process.env.NODE_ENV !== 'dev'
          ? await chromium.executablePath
          : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      ignoreHTTPSErrors: true,
      ignoreDefaultArgs: ['--disable-extensions']
    })

    console.log('Launching new page...')
    const page = await browser.newPage()

    console.log('Going to Opensea...')
    await page.goto(
      `https://testnets.opensea.io/assets/rinkeby/${contractAddress}/${tokenId}`
    )

    // console.log('Wait 1 sec...')
    await pause(1000)
    await page.waitForSelector('[value="refresh"]')

    await page.click('[value="refresh"]')
    // console.log('Clicked refresh')

    // console.log('Taking screenshot...')
    // await page.screenshot({ path: 'example.png' })
    // await page.screenshot({ type: 'png' })

    console.log(`Token ${tokenId} finished and ready to close browser...`)
    browser.close()

    res.status(200).json({ message: `TokenID ${tokenId} finished` })
  } catch (error) {
    console.dir(error)
    res.status(500).json({ message: `Something went wrong! Error: ${error}` })
  }
}
