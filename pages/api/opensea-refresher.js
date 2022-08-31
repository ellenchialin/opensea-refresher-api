const chromium = require('chrome-aws-lambda')

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { contractAddress, tokenId } = req.body
    const isTestnets = req.body.isTestnets === 'true'
    const isERC = req.body.isERC === 'true'

    try {
      const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--disable-extensions']
      })

      console.log('Launching new page...')
      const page = await browser.newPage()
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
      )

      if (isTestnets) {
        console.log('Going to Opensea testnets...')
        await page.goto(
          `https://testnets.opensea.io/assets/rinkeby/${contractAddress}/${tokenId}`
        )
      } else {
        console.log('Going to Opensea...')
        await page.goto(
          `https://opensea.io/assets/${
            isERC ? 'ethereum/' : 'matic/'
          }${contractAddress}/${tokenId}`
        )
      }

      // await pause(1000)
      // await page.click('[value="refresh"]')
      const title = await page.title()

      console.log(`Token ${tokenId} finished and ready to close browser...`)
      browser.close()

      res.status(200).json({ message: `Token ${tokenId} finished`, title })
    } catch (error) {
      console.dir(error)
      res.status(500).send({ error: `Something went wrong! ${error}` })
    }
  } else {
    res.status(500).send({ error: 'Please use POST method to call this api' })
  }
}
