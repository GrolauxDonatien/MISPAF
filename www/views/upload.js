mispaf.addPage({
    id: 'upload',
    class:"center",
    html: `
    <h4>Formulaire d'upload</h4>
    <div>
        <div class="box">
            <form data-id="form">
                <div class="boxtop">
                    <div>
                        <label for="ufile">Fichier</label> : <input type="file" id="ufile" name="upload">
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

