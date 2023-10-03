mispaf.addPage({
    id: 'listUploads',
    class: "card",
    html: `
    <div class="card-body p-0">
    <div class="p-4">
        <table class="table">
            <thead>
                <tr>
                    <th>Identifiant</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody data-id="tbody">
            </tbody>
        </table>
    </div>
</div>
    `,
    async enter(event) {
        let files;
        try {
            files = await mispaf.api('file/listUploads');
        } catch (e) {
            mispaf.page('error', e.message);
        }
        let rows = [];
        for (let i = 0; i < files.files.length; i++) {
            rows.push(`
<tr>
    <td><a href="${mispaf.escape(files.root)}/${mispaf.escape(files.files[i])}" target="_blank">${mispaf.escape(files.files[i])}</a></td>
</tr>
`);
        }
        this.tbody.innerHTML = rows.join('');
    }
});

