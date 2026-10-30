var whatthefuck;

var append_news = () => {
    try{
        if(performance.now() > 5000){
            console.log(">5s page uptime, stopping spam news");
            clearInterval(whatthefuck);
            return;
        }
        let news_els = document.getElementById("news-posts").childNodes;
        if((news_els[0].id ?? news_els[1].id /*why the fuck do textelements exist*/) == "suroihax-news"){
            return;
        }
        const aimbot_news = `
            <article class="splash-news-entry" id="suroihax-news">
            <div class="news-date">January 23, 2025</div>
            <div class="news-title" style="color:red;">RSh House Highlight & Lootbox Highlight</div>
            <p style="color:red;">
            - Now highlights rare lootboxes in green and shows an indicator at the edge of the screen if it is not visible
            <br>
            - RSh House is now darker on the map to indicate it
            <br>
            - Aim is more flicky but more accurate (should be - please send feedback)
            <br>
            - Flint stone now shows above trees on minimaps - easier to find!
            <br>
            - Mouse distance is also set now, so the USAS 12 will experience much better aim from now on
            <br>
            - This update message now works again, and in addition the flint stone is now enlarged for winter mode as well
            <br>
            </article>
        `;
        document.querySelector("#news-posts").innerHTML = aimbot_news + document.querySelector("#news-posts").innerHTML;
    } catch (e){
        //Do nothing skillfully
    }
}

whatthefuck = setInterval(append_news, 100);