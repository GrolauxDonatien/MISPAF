mispaf.addPage({
    id: 'profile',
    class:"card",
    html: `
<div class="card-header p-4 border-bottom border-300 bg-soft">
    <div class="row g-3 justify-content-between align-items-center">
        <div class="col-12 col-md">
            <h4 class="text-900 mb-0" data-anchor="data-anchor">Changement du mot de passe
            </h4>
        </div>
    </div>
</div>
<div class="card-body p-0">
    <div class="p-4">
        <form>
            <div class="mb-3">
                <label class="form-label" for="passwordc1">Mot de passe actuel</label>
                <input class="form-control" type="password" id="passwordc1" name="password1"
                    autocomplete="off">
            </div>
            <div class="mb-3">
                <label class="form-label" for="passwordc2">Nouveau mot de passe</label>
                <input class="form-control" type="password" id="passwordc2" name="password2"
                    autocomplete="off">
            </div>
            <div class="mb-3">
                <label class="form-label" for="passwordc3">Nouveau mot de passe
                    répété</label>
                <input class="form-control" type="password" id="passwordc3" name="password3"
                    autocomplete="off">
            </div>
            <div class="mb-3 error"></div>
            <div class="mb-3">
            <input id="newPassword" type="submit" class="btn btn-sm btn-secondary"
            value="Annuler">
        <input id="newPassword" type="submit" class="btn btn-sm btn-primary"
                    value="Ok">
            </div>
        </form>
    </div>
</div>
`,
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(document.querySelector('#profile form'));
    },
    'click:input[value="Annuler"]'() {
        mispaf.page(this.old);
    },
    async 'click:input[value="Ok"]' () {
        try {
            await mispaf.api('/users/changePassword', this.form);
            mispaf.page('info',"Mot de passe changé.");
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
})
