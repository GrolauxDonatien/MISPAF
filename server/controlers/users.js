const bcrypt = require("bcrypt");

module.exports = ({ model, user, HTTPError, assert }) => {

    assert(() => {
        if (!user.login) throw new HTTPError("Access Denied", 403);
    });

    return {
        listUsers() {
            return model.users.list();
        },
        delete(params) {
            let myid = model.users.getByLogin(user.login).id;
            if (params.id == myid) {
                throw new HTTPError("Vous ne pouvez pas vous effacer vous-même.");
            }
            return model.users.delete(params.id, 422);
        },
        async changePassword(params) {
            // fetch password
            user = model.users.getByLogin(user.login);
            if (!await bcrypt.compare(params.password1, user.password)) {
                throw new HTTPError("Ancien mot de passe invalide", 422);
            } else if (params.password2.trim() == "") {
                throw new HTTPError("Nouveau mot de passe manquant.", 422);
            } else if (params.password2 != params.password3) {
                throw new HTTPError("Les mot de passe sont différents.", 422);
            }
            let hash = await bcrypt.hash(params.password2, 10);
            model.users.updatePassword(user.id, hash);
        }
    }
}