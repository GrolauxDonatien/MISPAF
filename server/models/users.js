module.exports = ({ db }) => {

    return {
        register(user) {
            db.prepare("INSERT INTO users(login,password) VALUES (?,?)").run(user.login, user.password);
        },
        getByLogin(login) {
            return db.prepare("SELECT * FROM users WHERE login=?").get(login);
        },
        list() {
            return db.prepare("SELECT * FROM users").all();
        },
        delete(id) {
            return db.prepare("DELETE FROM users WHERE id=?").run(id);
        },
        updatePassword(id,password) {
            db.prepare("UPDATE users SET password=? WHERE id=?").run(password,id);
        }
    }

}