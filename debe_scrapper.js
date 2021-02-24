const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseURL = 'https://eksisozluk.com';

async function debe_scrapper(){
    console.log('debe_scrapper');

    // Step 1 -> get debe urls
    let response = await axios.get(baseURL + '/debe');
    let $ = cheerio.load(response.data);

    let debeURLs = [];
    $('#content-body ul li a').each(function () {
        debeURLs.push(baseURL + this.attribs.href);
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
           console.log('error ' + entryURL);
       }
    }
    
    console.log('entries length: ' + entries.length)

    // Step 3 -> write them in a file
    let fileName = new Date().getDate() + '-' + Number(new Date().getMonth() + 1) + '-' + new Date().getFullYear();
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