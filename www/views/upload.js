mispaf.addPage({
    id: 'upload',
    class:"card",
    html: `
<div class="card-header p-4 border-bottom border-300 bg-soft">
    <div class="row g-3 justify-content-between align-items-center">
        <div class="col-12 col-md">
            <h4 class="text-900 mb-0" data-anchor="data-anchor">Formulaire d'upload</h4>
        </div>
    </div>
</div>
<div class="card-body p-0">
    <div class="p-4">
        <form data-id="form">
            <div class="mb-3">
                <div>
                    <label class="form-label" for="ufile">Fichier</label> : <input
                        type="file" id="ufile" class="form-control" name="upload">
                </div>
            </div>
            <hr>
            <input type="submit" value="Annuler" class="btn btn-sm btn-secondary">
            <input type="submit" value="Ok" class="btn btn-sm btn-primary">
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
            await mispaf.api('file/upload', this.form);
            // go back to home directory
            mispaf.page("info","Le fichier a bien été envoyé.");
            mispaf.reset(this.form);
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});

