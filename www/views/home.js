mispaf.addPage({
    id: "home",
    html: `
    <br>
    <h1 style="text-align:center">Bienvenue sur notre site.</h1> <br>
    <br>
    <h4 data-id="info" style="text-align:center">Veuillez vous inscrire ou vous authentifier pour continuer.</h4>
`,
    async enter() {
        try {
            let response = await mispaf.api("auth/whoami");
            if (response != null) {
                mispaf.user = response.login;
                document.body.classList.remove("nologin");
                document.body.classList.add("login");
                this.info.innerText = "Bienvenue " + mispaf.user + " !"
            } else {
                mispaf.user = null;
                document.body.classList.add("nologin");
                document.body.classList.remove("login");
                this.info.innerText = "Veuillez vous inscrire ou vous authentifier pour continuer"
            }
        } catch (e) { mispaf.page('error',e.message) };
    },
    create() {
        mispaf.page('home');
    }
});

document.getElementById("logoutBtn").addEventListener('click', async () => {
    try{
        await mispaf.api("auth/logout");
        mispaf.page('home');
    } catch (e) {
        mispaf.page('error',e.message);
    }
});


