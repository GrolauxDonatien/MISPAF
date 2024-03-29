mispaf.addPage({
    id: "listUsers",
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
</div>`, async enter() {
        this.tbody.innerHTML = '';
        let response;
        try {
            response = await mispaf.api('/users/listUsers');
        } catch (e) {
            mispaf.page('error', e.message);
        }
        let rows = [];
        for (let i = 0; i < response.length; i++) {
            rows.push(`
<tr>
    <td>${mispaf.escape(response[i].login)}</td>
    <td><button onclick="deleteUser(${response[i].id})" class="btn btn-secondary">Effacer...</button></td>
</tr>
`);
        }
        this.tbody.innerHTML = rows.join('');
    }
});

async function deleteUser(id) {
    try {
        await mispaf.api('/users/delete', { id });
        mispaf.page(mispaf.page()); // refresh page
    } catch (e) {
        mispaf.page('error', e.message);
    }
}