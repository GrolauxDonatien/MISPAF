mispaf.addPage({
    id: 'profile',
    class:"center",
    html: `
<h4>Changement du mot de passe</h4>
<div>
    <div class="box">
        <form data-id="_form">
            <div class="boxtop">
                <div>
                <label for="cpassword1">Mot de passe actuel :</label> : <input type="password" id="cpassword1" name="password1">
                </div>
                <div>
                <label for="cpassword2">Nouveau mot de passe :</label> : <input type="password" id="cpassword2" name="password2">
                </div>
                <div>
                <label for="cpassword3">Nouveau mot de passe répété :</label> : <input type="password" id="cpassword3" name="password3">
                </div>
            </div>
            <hr>
            <input type="submit" value="Annuler" class="roundedButton">
            <input type="submit" value="Ok" class="roundedButton">
        </form>
    </div>
</div>
`,
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(document.querySelector('#login form'));
    },
    'click:input[value="Annuler"]'() {
        mispaf.page(this.old);
    },
    async 'click:input[value="Ok"]' () {
        try {
            await mispaf.api('/users/changePassword', this._form);
            mispaf.page('info',"Mot de passe changé.");
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
})
