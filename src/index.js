const puppeteer = require('puppeteer');

const hostList = [
    "github.com",
    "assets-cdn.github.com",
    "github.global.ssl.fastly.net",
    "github.githubassets.com",
    "avatars0.githubusercontent.com",
    "avatars1.githubusercontent.com",
    "avatars2.githubusercontent.com",
    "avatars3.githubusercontent.com",
    "avatars4.githubusercontent.com",
    "api.github.com",
    "codeload.github.com",
    "raw.githubusercontent.com",
    "camo.githubusercontent.com"
];

(async () => {
    console.log('Start ...\n')

    const promiseList = [];
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        // headless: false,
        // devtools: true,
        args: [
            '--no-sandbox',
            '--enable-strict-mixed-content-checking',
            '--unsafely-treat-insecure-origin-as-secure'
        ]
    });
    for (const host of hostList) {
        promiseList.push(getIpAddress(browser, host))
    }
    const result = await Promise.all(promiseList)
    format(result)
    await browser.close()
    console.log('\nDONE!')
})();

function format(result) {
    console.log(`# ----------------------------------------------`)
    console.log(`# ----- Copy This To Modify /etc/host File -----`)
    console.log(`# ----------------------------------------------`)
    for (const info of result) {
        if (info.ip && /(\d+)\.(\d+).(\d+).(\d+)/.test(info.ip)) {
            console.log(`${info.ip}${Array(17 - (info.ip || []).length).join(' ')}${info.origin}`)
        } else {
            console.log(`# Error -> ${info.origin}`)
        }
    }
    console.log(`# ----------------------------------------------`)
}

function getSearchUrl(origin) {
    if (!/^http/.test(origin)) origin = `https://${origin}`
    let urlInfo = new URL(origin)
    let hostSubName = urlInfo.hostname.split('.').reverse().reduce((total, current) => {
        return total.length < 2 ? total.push(current) : null, total
    }, []).reverse().join('.')
    if (hostSubName === urlInfo.hostname) {
        return `https://${hostSubName}.ipaddress.com/`
    }
    return `https://${hostSubName}.ipaddress.com/${urlInfo.hostname}`
}

async function getIpAddress(browser, origin) {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36")

    try {
        await page.goto(getSearchUrl(origin), {waitUntil: 'domcontentloaded'});
        return {origin, ip: await getFromPage(page)};
    } catch (e) {
        return {origin, error: e.toString()};
    }
}


async function getFromPage(page) {
    return page.evaluate(() => {
        return document.querySelector("#dnsinfo > tr:nth-child(1) > td:nth-child(3) > a").innerText
    })
}
