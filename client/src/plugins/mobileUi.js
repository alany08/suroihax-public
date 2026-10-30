//completely disable text selection - sometimes appears when dragging joysticks
function applyChanges(){
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
    document.documentElement.setAttribute("style", "user-select: none; -webkit-user-select: none");
    const custom_style = document.createElement("style");
    custom_style.innerText = `
    #splash-featured-people, #splash-news, #splash-socials, #chat-container{
        display: none !important;
    }
    #splash-modals{
        flex-direction: column !important;
        /*max-width: 100% !important;*/
    }
    #splash-center{
        margin-right: 0px !important;
    }
    #splash-options, #splash-customize{
        max-width: 100% !important;
        margin: 0px;
    }
    `;
    document.head.appendChild(custom_style);
    //window.location.href = "https://google.com/"
};

const _int = setInterval(() => {
    if(document.body){
        applyChanges();
        clearInterval(_int);
    }
}, 100);
