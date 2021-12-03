const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();  // headless
  //const browser = await puppeteer.launch({ headless: false });    // open browser

  // Launch new browser page
  const page = await browser.newPage();
  await page.setViewport({
    width: 1840,
    height: 1100,
    deviceScaleFactor: 1,
  });

  // 1. Navigate to given URL
  await page.goto('https://store.steampowered.com/');

  // 2. Click Top Sellers and print
  await page.evaluate(() => {
    [...document.querySelectorAll('a > span')].find(element => element.textContent === 'Top Sellers').click();
  });

  await Promise.all([
    page.waitForNavigation()
  ]);

    const top_sellers_name = await page.evaluate(() => Array.from(document.querySelectorAll('#search_resultsRows > a > .responsive_search_name_combined > .search_name > .title'), element => element.textContent));
    console.log('\n');
    console.log('Top seller games');
    console.log('****************');
    top_sellers_name.forEach(function(name) {
        console.log(name);
    });
    console.log('\n');
    
    //3.  Categorize games based on price 
    free_games = []  // initialize
    regular_price = []
    on_sale = []

    const game_prices = await page.evaluate(() => Array.from(document.querySelectorAll('#search_resultsRows > a > .responsive_search_name_combined > .search_price_discount_combined '), element => 
        element.textContent));


        for (let i = 0; i < game_prices.length; i++) {
            if (game_prices[i].indexOf('Free') > -1)  free_games.push(i);
            else if (game_prices[i].indexOf('%') > -1)  on_sale.push(i);
            else regular_price.push(i);
        }

        console.log('Free -- Top seller games');
        console.log('************************');
        free_games.forEach(function(i) {
            console.log(top_sellers_name[i])
        });
        console.log('\n');

        console.log('Regular price -- Top seller games');
        console.log('*********************************');
        regular_price.forEach(function(i) {
            console.log(top_sellers_name[i])
        });
        console.log('\n');

        console.log('On sale -- Top seller games');
        console.log('***************************');
        on_sale.forEach(function(i) {
            console.log(top_sellers_name[i])
        });

        //4. Print games in a CSV file

        game_details = []
        // get details 

        // you got the names in top_sellers_name already
        const release_dates = await page.evaluate(() => Array.from(document.querySelectorAll('#search_resultsRows > a > .responsive_search_name_combined > .search_released '), element => 
        element.textContent));
        let prices = await page.evaluate(() => Array.from(document.querySelectorAll('#search_resultsRows > a > .responsive_search_name_combined > .search_price_discount_combined > .search_price '), element => 
        element.textContent));

        prices = prices.map((price) => {   // remove whitespaces
            return price.replace(/\s/g,'')
        });

        // get the actual price 
        prices = prices.map((price) => {
            if (price.split('$').length > 2) return 'CDN$'+price.split('$')[2];
            else return price
        })

        let games_num = top_sellers_name.length;
        let game_cats = []
        // Get the category 
        for(let i =0; i<games_num; i++) {
            if (free_games.indexOf(i) > -1) game_cats.push('Free');
            if (regular_price.indexOf(i) > -1) game_cats.push('Regular price');
            if (on_sale.indexOf(i) > -1) game_cats.push('On sale');
        }
        

        for(let g=0; g<games_num; g++) {
            let csv_entry = top_sellers_name[g] + "; " + release_dates[g] + " " + prices[g] + ", " + game_cats[g];
            game_details.push(csv_entry);
        }

        game_details = game_details.sort();

        console.log('\n');
        console.log('All top seller game details')
        console.log('***************************');
        console.log(game_details);
        
        var aOfa = game_details.map(function(str) {
            return str.split(';');
        });
        
        var game_details_final = aOfa.map(function(d){
            return d.join();
        }).join('\n');

        require('fs').writeFile('./results.csv', game_details_final, function (err) {
                if (err) {
                    console.error('There was an error!');
                }
            }
        );

        await page.screenshot({ path: 'example.png' });

        await browser.close();
    
})();
