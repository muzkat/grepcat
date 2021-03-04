const urlgrep = require('../src/crawler/urlgrep')

/*
 example report description
 */
let recipe = {
    targetUrl: '',
    reportName: '',
    reportDescription: {
        params: {}
    }
}

urlgrep.grep(recipe)