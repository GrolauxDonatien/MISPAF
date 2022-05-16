mispaf.addPage({
    id: 'login',
    class:"center",
    html: `
    <div class="box">
        <form data-id="form">
            <div class="boxtop">
                <div>
                    <label for="inputlogin">Authentifiant</label> : <input type="text" name="login"
                        id="inputlogin">
                </div>
                <div>
                    <label for="inputpassword">Mdp</label> : <input type="password" name="password"
                        id="inputpassword">
                </div>
                <div class="error"></div>
            </div>
            <hr>
            <input type="submit" data-id="cancel" value="Annuler" class="roundedButton">
            <input type="submit" data-id="ok" value="Ok" class="roundedButton">
        </form>
    </div>
    `,
    type: 'modal',
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(this.form);
    },
    'click:[data-id="cancel"]'() {
        mispaf.page(this.old);
    },
    async 'click:[data-id="ok"]'() {
        try {
            await mispaf.api('auth/login', this.form);
            mispaf.page('home');
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});
