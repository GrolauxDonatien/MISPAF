mispaf.addPage({
    id: 'register',
    class:"card",
    html: `
    <h1>Bienvenue sur notre site.</h1>
    <br>
    <div class="card-header p-4 border-bottom border-300 bg-soft">
        <div class="row g-3 justify-content-between align-items-center">
            <div class="col-12 col-md">
                <h4 class="text-900 mb-0" data-anchor="data-anchor">Formulaire d'inscription
                </h4>
            </div>
        </div>
    </div>
    <div class="card-body p-0">
        <div class="p-4">
            <form>
                <div class="mb-3">
                    <label class="form-label" for="ilogin">Identifiant</label>
                    <input class="form-control" type="text" id="ilogin" name="login" value="">
                </div>
                <div class="mb-3">
                    <label class="form-label" for="iname">Votre nom</label>
                    <input class="form-control" type="text" id="iname" name="name" value="">
                </div>
                <div class="mb-3">
                    <label class="form-label" for="ipassword1">Mot de passe</label>
                    <input class="form-control" type="password" id="ipassword1" name="password1"
                        value="" autocomplete="off">
                </div>
                <div class="mb-3">
                    <label class="form-label" for="ipassword2">Mot de passe répété</label>
                    <input class="form-control" type="password" id="ipassword2" name="password2"
                        value="" autocomplete="off">
                </div>
                <div class="mb-3">
                    <input class="btn btn-sm btn-secondary" type="submit" value="Annuler">
                    <input class="btn btn-sm btn-primary" type="submit" value="Ok">
                </div>
            </form>
        </div>
    </div>
    `,
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(this.form);
    },
    'click:input[value="Annuler"]'() {
        mispaf.page(this.old);
    },
    async 'click:input[value="Ok"]' () {
        try {
            await mispaf.api('auth/register', this.form);
            // go back to home directory
            mispaf.page('home');
            // display login page
            mispaf.page('login');
            // and then this information on top of the login page
            mispaf.page("info","Bravo, vous êtes enregistré mais vous devez encore vous connecter.");
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});