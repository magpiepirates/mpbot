const https = require('https')
const { parse } = require('node-html-parser')
const Entities = require('html-entities').AllHtmlEntities
const url = require('url')
const { Model } = require('mongoose')

const entities = new Entities();

/**
 * Gets the /music page of the given bandcamp URL
 * 
 * @param {String} path 
 * @returns {Promise<String[]>} urls
 */

const getFrontPage = (path) => {
    return new Promise((resolve, reject) => {
        let parsed = url.parse(path)
        if (!parsed.hostname.endsWith('bandcamp.com')) reject('[bcscraper] Invalid URL: not a bandcamp URL')
        if (parsed.hostname === 'bandcamp.com') reject('[bcscraper] Cannot parse bandcamp\'s homepage')
        let body = []
        https.get(`${parsed.protocol}//${parsed.hostname}/music`, res => {
            if (res.statusCode !== 200) reject(`[bcscraper] Bandcamp: Status code ${res.statusCode}. Cannot continue`)
            res.on("data", chunk => body.push(chunk))
        })
            .on("close", () => {
                let str = body.join("").replace(/\n/gi, '')
                let html = parse(str).removeWhitespace()
                let musicGrid = html.querySelectorAll('.music-grid-item');
                let urls = []
                musicGrid.forEach(element => {
                    let src = `${parsed.protocol}//${parsed.hostname}${element.childNodes[0].attributes['href']}`
                    urls.push(src);
                })
                resolve(urls);
            })
            .on('error', (err) => reject(err))
    })
}
/**
 * Gets the tracklist of a bandcamp album
 * 
 * @param {String} path 
 * @returns {Promise<String[]>} urls
 */

const getTracklist = (path) => {
    return new Promise((resolve, reject) => {
        let parsed = url.parse(path)
        if (!parsed.hostname.endsWith('bandcamp.com')) reject('[bcscraper] Invalid URL: not a bandcamp URL')
        if (parsed.hostname === 'bandcamp.com') reject('[bcscraper] Cannot parse bandcamp\'s homepage')
        let body = []
        https.get(parsed.href, res => {
            if (res.statusCode !== 200) reject(`[bcscraper] Bandcamp: Status code ${res.statusCode}. Cannot continue`)
            res.on("data", chunk => body.push(chunk))
        })
            .on("close", () => {
                let str = body.join("");
                let html = parse(str).removeWhitespace()
                let tracks = html.querySelectorAll('div.title')
                let albumTitle = html.querySelector('.trackTitle').text
                let data = []
                let type = 'album'
                if (parsed.pathname.startsWith('/album/')) {
                    tracks.forEach(t => {
                        let u = `${parsed.protocol}//${parsed.hostname}${t.childNodes[0].attributes['href']}`
                        let title = t.childNodes[0].childNodes[0].text
                        data.push({
                            url: u,
                            title: title
                        })
                    })
                } else {
                    type = 'track'
                    let u = parsed.href
                    let title = albumTitle
                    data.push({
                        url: u,
                        title: title
                    })
                }
                resolve({ url: path, type: type, title: albumTitle, tracklist: data });
            })
            .on('error', (err) => reject(err))
    })
}

/**
 * Get the link to the MP3 file from a track link
 * 
 * @param {String} path 
 * @returns {Promise<String[]>} url
 */

const getMP3 = (path) => {
    return new Promise((resolve, reject) => {
        let parsed = url.parse(path)
        if (!parsed.hostname.endsWith('bandcamp.com')) reject('[bcscraper] Invalid URL: not a bandcamp URL')
        if (parsed.hostname === 'bandcamp.com') reject('[bcscraper] Cannot parse bandcamp\'s homepage')
        let body = []
        https.get(parsed.href, res => {
            if (res.statusCode !== 200) reject(`[bcscraper] Bandcamp: Status code ${res.statusCode}. Cannot continue`)
            res.on("data", chunk => body.push(chunk))
        })
            .on("close", () => {
                let str = body.join("");
                // let trackRegex = /{"mp3-128":"(.+?)"/gi
                let trackRegex = /data-tralbum="(.+?)"/gi
                let dataStr = entities.decode(trackRegex.exec(str)[1])
                let url = JSON.parse(dataStr).trackinfo[0].file['mp3-128']
                resolve(url);
            })
            .on('error', (err) => reject(err))
    })
}

/**
 * Updates the tracklist stored in the db. Needs some more work tho
 * @param {Model} model 
 */
const updateTrackList = (model) => {
    function arrDifference(a1, a2) {
        let a = [], diff = [];
        for (let i = 0; i < a1.length; i++) a[a1[i]] = true;
        for (let i = 0; i < a2.length; i++) {
            if (a[a2[i]]) delete a[a2[i]];
            else a[a2[i]] = true;
        }
        for (let k in a) diff.push(k);
        return diff;
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    return model.find({}).exec()
        .then(async res => {
            let list = await getFrontPage('https://magpiepirates.bandcamp.com/')
            let trackData = []
            res = res.map(r => r.url)
            list = arrDifference(res, list)
            for (let i = 0; i < list.length; i++) {
                console.log('[bcscraper] Getting data for', list[i])
                trackData.push(await getTracklist(list[i]))
                await delay(100)
            }
            return Promise.resolve(trackData)
        })
        .then(newData => {
            let promises = []
            newData.forEach(d => promises.push(model.create(d)))
            return Promise.all(promises)
        })
        .then(res => console.log(`[bcscraper] Added ${res.length} new elements to the bc-list collection`))
}

module.exports = {
    getTracklist,
    getFrontPage,
    getMP3,
    updateTrackList
};