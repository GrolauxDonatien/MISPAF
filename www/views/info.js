mispaf.addPage({
    id: 'info',
    class: "center",
    html: `
    <div class="box">
        <form data-id="form">
            <h4>Information</h4>
            <div class="boxtop">
                <div data-id="info"></div>
            </div>
            <hr>
            <input type="submit" data-id="ok" value="Fermer" class="roundedButton">
        </form>
    </div>
    `,
    type: 'modal',
    enter(event, data) {
        this.old = event.leave;
        this.info.innerText = data;
    },
    'click:input'() {
        mispaf.page(this.old);
    }
});
