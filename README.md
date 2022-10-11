# Welcome to the MIcro SPA Framework!
MISPAF is a minimalist framework for developping single page applications in pure JavaScript. It is loosely inspired by JQuery, React, and the MVC architecture, among others.
It is designed to offer a very simple and straightforward solution to common use cases, without abstracting too much away from pure DOM manipulations. In other words, while typical frameworks offer abstractions that hides away the DOM mechanic, and makes you think in other terms, this framework keeps the DOM as the central abstraction point, while making it much easier to work with.

## Front-end side
```
mispaf.addPage({
    id: 'login',
    class:"center",
    html: `
    <div class="box">
        <form data-id="form">
            <div class="boxtop">
                <div>
                    <label for="inputlogin">Authentifiant</label> : <input type="text" name="login"
                        id="inputlogin">
                </div>
                <div>
                    <label for="inputpassword">Mdp</label> : <input type="password" name="password"
                        id="inputpassword">
                </div>
                <div class="error"></div>
            </div>
            <hr>
            <input type="submit" data-id="cancel" value="Annuler" class="roundedButton">
            <input type="submit" data-id="ok" value="Ok" class="roundedButton">
        </form>
    </div>
    `,
    type: 'modal',
    enter(event) {
        if ("leavePage" in event) this.old=event.leavePage;
        mispaf.reset(this.form);
    },
    'click:[data-id="cancel"]'() {
        mispaf.page(this.old);
    },
    async 'click:[data-id="ok"]'() {
        try {
            await mispaf.api('auth/login', this.form);
            mispaf.page('home');
        } catch (e) {
            mispaf.page('error',e.message);
        }
    }
});
```
In this example, we add a page which can be shown by ```mispaf.page("login")```, or by an HTML ```<a href="#login">``` tag. The keys of the object define this page :
- ```id``` sets its HTML ```id``` attribute, and is used to identify the page.
- ```class``` sets its CSS class, here center ensures it is displayed in the center of the window.
- ```html``` sets the HTML  content of this page, using a multi-line ES6 template string. Note the ```data-id="form"``` HTML attribute: it binds ```this.form``` to this DOM element, in the context of the functions defined here. Alternatively, you can embed the page HTML directly in index.html: make sure the HTML ```id``` attribute is set to this object ```id``` property, and do not provide this ```html``` property at all.
- ```type``` sets this page so that it is displayed as if it was a modal dialog box.
- ```enter``` defines a function that is called each time this page is displayed. The ```event``` parameter is an object gives context to the display of this page. For example, ```leave``` contains the id of the page we just left. Also, in the context of execution of the function, ```this``` is the DOM of the page, augmented by properties bound by the ```data-id``` HTML attributes of this page.  Here, ```data-id="info"``` is set on the div where the message should be displayed thanks to ```this.info.innerText=message```.
- ```click:...``` is a shortcut way to bind the ```click``` event on the ```...``` element in this page. Here, the Cancel button goes back to the page we where coming from, while the Ok button submits the login form to the server. Also note that we did not need to prevent the browser from submitting the form on its own (which makes no sense for a single page application): when bound this way, ```event.preventDefault()``` is always called implicitly.
- ```event.leavePage``` contains the id of the page that was shown before this modal dialog box. It is saved in ```this.old``` so that the function for the cancel button sends back to it by using ```mispaf.page(this.old)```.
- ```mispaf.reset(this.form)``` clears all inputs, selects, and textareas of the form. ```this.form``` is automatically set to the DOM element of the form, because it has this HTML attribute ```data-id="form"``` .
- ```mispaf.api('auth/login', this.form)``` emits an Ajax call to the ```auth/login``` endpoint. The payload of the HTTP request is defined by ```this.form```: as this is bound to a form DOM element, the content of the form is serialized as the payload. ```mispaf.api``` eventually returns the response of the back-end, which is ignored in this example. If the status code of the reply is not OK (200), then an exception is thrown, whose ```message``` contains the response from the server.

## Back-end side
As a single page application, the role of the server is limited to:

- Serve a single index.html page, and its resources
- Process HTTP request from the front-end. They are organized in the controlers folder, and automatically loaded when the server starts.
- Database access code is centralized in the models folder, and also automatically loaded when the server starts.

Here is an example with the models/users.js file:
```
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
```
The ```db``` object is a better-sqlite3 object already opened by the server. The SQLite3 database file can be configured in ```config.js```.

Here is an example with the controlers/auth.js file:
```
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
```
Each function can be triggered by an HTTP request whose path is ```auth/function name```. ```requireAuth``` is an exception, which tells if an authentified user is required before being able to call the functions, at all. Unless explicitly set to ```false```, an authentified user is required.
 When called, each function receives an object as parameter, which contains many useful keys:

- ```params``` is an object containing the payload of the request, typically the content of a form.
- ```model``` references the model files. Here, the ```getByLogin``` function from the ```model/users.js``` file is called by ```model.users.getByLogin```.
- ```setUser``` is a function that provides authentification information to the server. This enables the server to protect the controler functions requiring an authentification from being called, at all.
- ```clearUser``` removes the authentification information from the server.
- ```user``` is the user object provided by calling ```setUser``` before.
- ```HTTPError``` is an error class that embeds the HTTP status code of the error.

As you see, controler functions do not need to process the HTTP request and response objects directly. Anything returned by the function is JSON encoded as the HTTP reply. If an HTTPError exception is thrown, then the HTTP status and response are set according to the exception.

# API documentation
## config.js
```
module.exports={
    dbfile:"app.db",								// SQLite3 database file
    secret:"mqldsjkf mqlsdkfj mlqsdf kqmslfj",		// JWT secret token
    port:8080,										// Web server's port
    maxupload:"200mb",								// Maximum size of Ajax calls payload
    uploadDirectory:"uploads"						// Directory to put uploaded files
}
```
## Model
Model files are put in the ```server/models``` directory. Each file must export a function that takes an object as parameter, and returns an object whose keys/values define the model functions. The object parameter contains the value of the configuration object with an added ```db``` key, which contains the SQLite3 Database object (see [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md)).
The model functions of each file ```XXX.js``` are given to the controler functions through the ```model.XXX``` key of their parameter.

## Controler
Controler files are put in the ```server/controlers``` directory. Each file must return an object whose keys/values define the endpoints for the HTTP requests whose path is composed of ```name of the controler file/name of the function```. The one exception key is ```requireAuth``` which can be set to ```false``` to disable the requirement of having an authentified user before calling the function. 
When called, each function receives a parameter object with these keys:

- ```params```: The payload of the request, as an associative object.
- ```request```: The HTTP ```request ``` object.
- ```response```: The HTTP ```response``` object. If you use it to respond to the request, then the return of the function is ignored. Otherwise, the return of the function is JSON encoded as the response to the request.
- ```model```: An object to access the model functions.
- ```setUser(u)```, ```getUser()```, ```user```: manages the authentified user.
- ```config```: the config object,
- ```HTTPError```: a custom class that manages HTTP errors. Its constructor takes two parameters: 1. string that is the response message to the HTTP request, and 2. an integer that is the status code of the response.

## Views
Views files are put in the ```www/views``` directory. Each file is dynamically loaded by index.html, there is no need to add ```<script>``` tags. 

Typically, each view calls ```mispaf.addPage``` to set up a single page of the application.
The API of ```mispaf``` is composed of several parts:

- Form management:
	- ```mispaf.serializeObject(form)```: encodes the interactive elements of ```form``` into an object. Keys are the names of the elements. Checkboxes are encoded as booleans; radios are encoded as null when none checked, or the value of the one checked; files, reset, submit, are ignored and not encoded at all; the rests are encoded using their values.
	- ```mispaf.deserializeObject(form,data)```: decodes the content of the data object into the interactive elements of ```form```.
	- ```mispaf.reset(form)```: clears the form by resetting all interactive elements.
	- ```mispaf.validateNotEmpty(form,fields,msg)```: validates that the fields of ```form``` whose name are in the ```fields``` array are not empty. When this is not the case, the error message ```msg``` is inserted after the field. Returns ```true``` is all fields are not empty, otherwise ```false```.
	- ```mispaf.setFieldError(form,name,msg)```: inserts the error message ```msg``` in the page after the field with ```name``` in ```form```. If ```msg``` is null, then it removes the error message.
	- ```mispaf.clearErrors(form)```: removes all error messages in ```form```.

- HTML utility functions:
	- ```mispaf.escape(string)```: replaces special HTML characters in String to their HTML entities equivalent, ensuring the string can be inserted into source HTML and still be displayed as intended.
	- ```mispaf.unescape(string)```: reverse of ```escape```.
	- ```mispaf.parentElement(element,selector)```: returns the closest ancestor element of ```element``` that corresponds to the CSS ```selector```.

- Ajax calls:
	- ```mispaf.ajax({url,type,data,success,error,mimeType})```: emits an Ajax call. ```url``` is the endpoint, ```type``` is the HTTP method type (GET by default), ```data``` is the payload, ```success``` and ```error``` are callbacks in case of a succesful response (HTTP status 200) or not, and ```mimeType``` can be used to enforce a specific mime type for the payload. The payload can either be an object, or a form DOM element. In the later case, ```<input type="file">``` are supported (by using a base64 encoding).
	- ```mispaf.api(url,data)```: emits an Ajax call, and returns a promise. ```url``` is the endpoint, the HTTP method is always set to POST, and ```data``` is the payload. The payload can either be an object, or a form DOM element. In the later case, ```<input type="file">``` are supported (by using a base64 encoding).

- Navigation between the pages of the application:
	- ```mispaf.page()``` returns the ```id``` of the currently displayed page.
	- ```mispaf.page(id, data)``` changes the currently displayed page to the one defined by ```id```. The optional ```data``` parameter is passed as the second parameter of the ```enter``` function of this page.

- Menu management:
	- ```mispaf.setMenu(menuElement)``` manages ```<a href="#page">``` elements inside the root ```menuElement```, so that the links effectively display the pages, and so that the link corresponding to the currently displayed page is highlighted.

- Page creation: ```mispaf.addPage(page)``` adds a page, using the configuration specified in ```page```:
	- ```id``` sets its HTML ```id``` attribute, and is used to identify the page.
	- ```class``` sets its CSS class.
	- ```html``` sets the HTML  content of this page. Alternatively, you can embed the page HTML directly in index.html: make sure the HTML ```id``` attribute is set to this object ```id``` property, and do not provide the ```html``` property at all in that case.
	- ```type``` when set to ```modal```,  this page appears as a modal dialog box, with whatever previously page displayed blurred behind it. Otherwise, each page replaces the previous one.
	- ```create``` defines a function that is called after the insertion of this page HTML in the current document. Use this function if you need to further initialize the components displayed for example.
	- ```enter``` defines a function that is called each time this page is displayed. The first parameter (```event```) is an object that gives context to the display of this page. For example, ```leave``` contains the id of the page we just left, and ```leavePage``` has the same information but only for pages that are not modal. ```target``` contains the id of this page, as it is the target of this navigation operation. If you call ```event.preventDefault()```, you cancel the navigation to this page. The second parameter is further ```data``` that is transmitted when calling ```mispaf.page(id,data)```. Also, in the context of execution of the function, ```this``` is the DOM of the page, augmented by properties bound by the ```data-id``` HTML attributes of this page.
	- ```leave``` defines a function that is called when this page is currently displayed, and we are in the process of navigating to another page. Once again, calling ```event.preventDefault()``` on the first ```event``` parameter cancels the migration.
	- ```event:selector``` is a shortcut way to bind the DOM ```event``` to the elements of this page that follow this CSS ```selector```.  The listener function does not need to call ```event.preventDefault()``` to prevent the navigator from doing its own form submission. As this makes no sense for a single page application, this is done by ```mispaf``` automatically.
