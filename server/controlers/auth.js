const bcrypt = require("bcrypt");

module.exports = ({HTTPError, model, setUser, user, clearUser}) => {
    return {
        async login(params) {
            let user = model.users.getByLogin(params.login);
            if (user && await bcrypt.compare(params.password, user.password)) {
                setUser({ login: user.login });
            } else {
                throw new HTTPError("Invalid user/password", 403);
            }
        },
        async register(params) {
            let hash = await bcrypt.hash(params.password1, 10);
            model.users.register({ login: params.login, password: hash });
        },
        async whoami() {
            if (user.login) {
                return user;
            } else {
                return null;
            }
        },
        async logout() {
            clearUser();
        }
    }
}
