mispaf.addPage({
    id: 'login',
    class:"center",
    html: `
    <div class="container">
    <form>
        <div class="row flex-center py-5">
            <div class="col-sm-10 col-md-8 col-lg-5 col-xl-5 col-xxl-3"><a
                    class="d-flex flex-center text-decoration-none mb-4" href="index.html">
                    <div class="d-flex align-items-center fw-bolder fs-5 d-inline-block">
                        <img src="assets/logo.png" width="58">
                    </div>
                </a>
                <div class="text-center mb-7">
                    <h3 class="text-1000">Authentification</h3>
                    <p class="text-700">Accéder à votre compte</p>
                    <div class="mb-3 text-start">
                        <label class="form-label" for="inputlogin">Votre identifiant</label>
                        <div class="form-icon-container">
                            <input class="form-control form-icon-input" id="inputlogin"
                                type="text" name="login" placeholder="votrelogin"
                                autocomplete="on"><svg
                                class="svg-inline--fa fa-user text-900 fs--1 form-icon"
                                aria-hidden="true" focusable="false" data-prefix="fas"
                                data-icon="user" role="img"
                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"
                                data-fa-i2svg="">
                                <path fill="currentColor"
                                    d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z">
                                </path>
                            </svg><!-- <span class="fas fa-user text-900 fs--1 form-icon"></span> Font Awesome fontawesome.com -->
                        </div>
                    </div>
                    <div class="mb-3 text-start"><label class="form-label"
                            for="inputpassword">Mot de passe</label>
                        <div class="form-icon-container">
                            <input class="form-control form-icon-input" id="inputpassword"
                                name="password" type="password" placeholder="Password"
                                autocomplete="current-password"><svg
                                class="svg-inline--fa fa-key text-900 fs--1 form-icon"
                                aria-hidden="true" focusable="false" data-prefix="fas"
                                data-icon="key" role="img"
                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
                                data-fa-i2svg="">
                                <path fill="currentColor"
                                    d="M282.3 343.7L248.1 376.1C244.5 381.5 238.4 384 232 384H192V424C192 437.3 181.3 448 168 448H128V488C128 501.3 117.3 512 104 512H24C10.75 512 0 501.3 0 488V408C0 401.6 2.529 395.5 7.029 391L168.3 229.7C162.9 212.8 160 194.7 160 176C160 78.8 238.8 0 336 0C433.2 0 512 78.8 512 176C512 273.2 433.2 352 336 352C317.3 352 299.2 349.1 282.3 343.7zM376 176C398.1 176 416 158.1 416 136C416 113.9 398.1 96 376 96C353.9 96 336 113.9 336 136C336 158.1 353.9 176 376 176z">
                                </path>
                            </svg><!-- <span class="fas fa-key text-900 fs--1 form-icon"></span> Font Awesome fontawesome.com -->
                        </div>
                    </div>
                    <div class="row flex-between-center mb-7">
                    </div>
                    <input type="submit" value="Ok" id="loginok" class="btn btn-primary w-100 mb-3">
                    <input type="submit" value="Annuler" class="btn btn-secondary w-100 mb-3">
                </div>
            </div>
        </div>
    </form>
    </div>
    `,
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(this.form);
    },
    'click:input[value="Annuler"]'(event) {
        event.preventDefault();
        mispaf.page(this.old);
    },
    async 'click:#loginok'(event) {
        console.log("here");
        event.preventDefault();
        try {
            await mispaf.api('auth/login', this.form);
            mispaf.page('home');
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});
