mispaf.addPage({
    id: 'info',
    class: "center",
    html: `
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Information</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" data-id="info"></div>
            <div class="modal-footer">
                <button class="btn btn-primary">Fermer</button>
            </div>
        </div>
    </div>
    `,
    type: 'modal',
    enter(event, data) {
        this.old = event.leave;
        this.info.innerText = data;
    },
    'click:button'() {
        mispaf.page(this.old);
    }
});
