mispaf.addPage({
    id: "home",
    html: `
    <br>
    <h1 style="text-align:center">Bienvenue sur notre site.</h1> <br>
    <br>
    <h4 style="text-align:center" data-id="info">Veuillez vous inscrire ou vous authentifier pour
        continuer.</h4>
    <footer class="footer position-absolute">
        <div class="row g-0 justify-content-between align-items-center h-100">
            <div class="col-12 col-sm-auto text-center">
                <p class="mb-0 mt-2 mt-sm-0 text-900">&#x24B8; 2022 Donatien Grolaux</p>
            </div>
        </div>
    </footer>
`,
    async enter() {
        let response;
        try {
            response = await mispaf.api("auth/whoami");
        } catch (e) {
            mispaf.page('error', e.message);
            response = null;
        };
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
    },
    create() {
        mispaf.page('home');
    }
});

document.getElementById("logoutBtn").addEventListener('click', async () => {
    try {
        await mispaf.api("auth/logout");
        mispaf.page('home');
    } catch (e) {
        mispaf.page('error', e.message);
    }
});


