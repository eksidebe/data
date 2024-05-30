const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseURL = 'https://eksisozluk.com';
let retry = 0;

axios.interceptors.response.use((response) => {
    retry = 0;
    return response;
}, (error) => {
    if (retry < 3) {
        retry++;
        console.log('retrying... ' + retry);
        return axios.request(error.config);
    }
    return Promise.reject(error);
});

async function debe_scrapper(){
    console.log('debe_scrapper');

    // Step 1 -> get debe urls
    let response;
    try {
        response = await axios.get(baseURL + '/debe', {timeout: 5000});    
    } catch (error) {
        console.error('first fetch: '+ JSON.stringify(error));
        throw error;
    }
    
    let $ = cheerio.load(response.data);

    let debeURLs = [];
    $('#partial-index ul li a').each(function () {
        //debeURLs.push(baseURL + this.attribs.href);
	debeURLs.push(this.href);
    });

    console.log(debeURLs);
    console.log(debeURLs.length);

    // Step 2 -> get each debe entry
    let entries = [];
    
    for (let i = 0; i< debeURLs.length; i++){
        let entryURL = debeURLs[i];
        try{
            response = await axios.get(debeURLs[i]);
            $ = cheerio.load(response.data);
   
            let title = $('#title').get(0).attribs["data-title"];
            let content = $('.content').html();
            let author = $('.entry-author').text();
            let authorURL = baseURL + $('.entry-author').attr('href');
            let entry = new Enrty(title, content, author, authorURL, entryURL);
            
            entries.push(entry);
            console.log('success ' + entryURL);
       } catch(e){
           console.log('error ' + entryURL + '\n' + JSON.stringify(e));
       }
    }
    
    console.log('entries length: ' + entries.length)

    // Step 3 -> write them in a file
    // yyyy-mm-dd
    let fileName = new Date().getFullYear() + '-' + Number(new Date().getMonth() + 1) + '-' + new Date().getDate();
    try {
        await writeJsonFile(fileName, entries);
    } catch (error) {
        console.error(error);
    }
    
    console.log('finished!');

}

function writeJsonFile(fileName, content){
	return new Promise(function(resolve,reject){
		fs.writeFile("./data/" + fileName + ".json", JSON.stringify(content), function(err) {
			if(err) {
                reject(err.message);
                return;
			}
			console.log('write success');
			resolve();
		}); 
	})
};

class Enrty{
    constructor(title, content, author, authorURL, entryURL){
        this.title = title;
        this.content = content;
        this.author = author;
        this.authorURL = authorURL;
        this.entryURL = entryURL;
    }
}

debe_scrapper();
