mispaf.addPage({
    id: "listUsers",
    class:"margins",
    html: `
<table class="margins">
    <thead>
        <tr>
            <th>Identifiant</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody data-id="tbody">
    </tbody>
</table>
`, async enter() {
        this.tbody.innerHTML = '';
        try {
            let response = await mispaf.api('/users/listUsers');
            let rows = [];
            for (let i = 0; i < response.length; i++) {
                rows.push(`
<tr>
    <td>${mispaf.escape(response[i].login)}</td>
    <td><button onclick="deleteUser(${response[i].id})">Effacer...</button></td>
</tr>
`);
            }
            this.tbody.innerHTML = rows.join('');
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});

async function deleteUser(id) {
    try {
        await mispaf.api('/users/delete',{id});
        mispaf.page(mispaf.page()); // refresh page
    } catch (e) {
        mispaf.page('error',e.message);
    }
}