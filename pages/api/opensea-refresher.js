const chromium = require('chrome-aws-lambda')
const Cors = require('cors')

const cors = Cors({
  methods: ['POST', 'GET']
})

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors)

  if (req.method === 'POST') {
    const { contractAddress, isMainnet, nftNetwork, tokenId } = req.body

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

      page.on('response', (response) => {
        if (response.status() == 404 || response.status() == 400) {
          return res.status(404).json({
            error:
              'The NFT page does not exist. Please check contract address and token Id.'
          })
        }
      })

      if (isMainnet === 'true') {
        console.log('Going to Opensea...')
        await page.goto(
          `https://opensea.io/assets/${
            nftNetwork === 'ethereum' ? 'ethereum/' : 'matic/'
          }${contractAddress}/${tokenId}`,
          {
            waitUntil: 'networkidle0'
          }
        )
      } else {
        console.log('Going to Opensea testnets...')
        await page.goto(
          `https://testnets.opensea.io/assets/rinkeby/${contractAddress}/${tokenId}`,
          {
            waitUntil: 'networkidle0'
          }
        )
      }

      // await page.click('[value="refresh"]')
      const title = await page.title()

      console.log(`Token ${tokenId} finished and ready to close browser...`)
      browser.close()

      return res
        .status(200)
        .json({ message: `Token ${tokenId} finished`, title })
    } catch (error) {
      console.dir(error)
      res.status(500).send({ error: `Something went wrong! ${error}` })
    }
  } else {
    res.status(500).send({ error: 'Please use POST method to call this api' })
  }
}
