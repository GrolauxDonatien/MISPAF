mispaf.addPage({
    id: 'error',
    class: "center",
    html: `
    <div class="box">
        <form data-id="form">
            <h4>Erreur !</h4>
            <div class="boxtop">
                <div class="error" data-id="error"></div>
            </div>
            <hr>
            <input type="submit" data-id="ok" value="Fermer" class="roundedButton">
        </form>
    </div>
    `,
    type: 'modal',
    enter(event, data) {
        this.old = event.leave;
        if (data.startsWith("<!DOCTYPE html>")) {
            this.error.innerHTML="<iframe>";
            this.error.children[0].contentWindow.document.write(data);
        } else {
            this.error.innerText = data;
        }
    },
    'click:input'() {
        mispaf.page(this.old);
    }
});
