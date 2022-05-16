const bcrypt = require("bcrypt");

module.exports = {
    requireAuth: false,
    async login({ params, model, setUser, HTTPError }) {
        let user = model.users.getByLogin(params.login);
        if (user && await bcrypt.compare(params.password, user.password)) {
            setUser({ login: user.login });
        } else {
            throw new HTTPError("Invalid user/password", 403);
        }
    },
    async register({ params, model }) {
        let hash = await bcrypt.hash(params.password1, 10);
        model.users.register({login:params.login, password:hash});
    },
    async whoami({ user }) {
        return user;
    },
    async logout({clearUser}) {
        clearUser();
    }
}
