mispaf.addPage({
    id: 'register',
    class:"center",
    html: `
    <h4>Formulaire d'inscription</h4>
    <div>
        <div class="box">
            <form data-id="form">
                <div class="boxtop">
                    <div>
                        <label for="rlogin">Identifiant</label> : <input type="text" id="rlogin" name="login"
                            value="">
                    </div>
                    <div>
                        <label for="name">Votre nom</label> : <input type="text" id="name" name="name" value="">
                    </div>
                    <div>
                        <label for="password1">Mot de passe</label> : <input type="password" id="password1"
                            name="password1" value="">
                    </div>
                    <div>
                        <label for="password2">Mot de passe répété</label> : <input type="password"
                            id="password2" name="password2" value="">
                    </div>
                </div>
                <hr>
                <input type="submit" value="Annuler" class="roundedButton">
                <input type="submit" value="Ok" class="roundedButton">
            </form>
        </div>
    </div>
    `,
    type:'modal',
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