/******************************************************
* MInimalist Single Page Application Framework
*
* Copyright 2022 Donatien Grolaux
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
* and associated documentation files (the "Software"), to deal in the Software without restriction, 
* including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
* subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
* INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
* IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
* OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const mispaf = (function () {

    function serializeObject(form) {
        // cette fonction va parcourir tous les éléments du formulaire, et remplir un objet associatif
        let field, s = {};
        if (typeof form == 'object' && form.nodeName == "FORM") { // le paramètre est bien l'objet DOM d'un formulaire ?
            let len = form.elements.length; // longueur de tous les champs de ce formulaire
            for (i = 0; i < len; i++) { // parcours de ces champs
                field = form.elements[i];
                // le champ doit avoir un nom, être activé, et être d'un type qui a un sens pour ce serializeObject
                if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
                    if (field.type == 'select-multiple') { // le select multiple est particulier car il faut un tableau pour retenir les différentes options sélectionnées
                        s[field.name] = [];
                        for (j = form.elements[i].options.length - 1; j >= 0; j--) {
                            if (field.options[j].selected)
                                s[field.name].push(field.options[j].value);
                        }
                    } else if (field.type == 'checkbox') { // le checkbox est particulier : value est toujours le même qu'il soit sélectionné ou pas. A la place, on prend .checked
                        s[field.name] = field.checked
                    } else if (field.type == 'radio') { // le radio est particulier
                        if (field.checked) { // est-ce que l'élément est coché ?
                            s[field.name] = field.value;
                        } else if (s[field.name] === undefined) { // est-ce qu'il existe dans s ?
                            // ceci permet d'avoir null pour un groupe de radio si aucun champ n'est sélectionné
                            s[field.name] = null;
                        }
                    } else { // cas général : c'est value qui contient ce qu'a édité l'utilisateur
                        s[field.name] = field.value;
                    }
                }
            }
        }
        return s;
    }

    function deserializeObject(form, data) {
        if (!form || form.tagName != "FORM") {
            throw new Error("Invalid first parameter, not a FORM DOM element");
        }
        // cette fonction va aussi parcourir le formulaire et non pas parcourir data
        let len = form.elements.length;
        for (i = 0; i < len; i++) {
            field = form.elements[i];
            // le champ doit avoir un nom, avoir une entrée dans data, être activé, et être d'un type qui a un sens pour ce serializeObject
            if (field.name && data[field.name] != undefined && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
                if (field.type == 'select-multiple') { // le select multiple est particulier car il faut un tableau pour retenir les différentes options sélectionnées
                    for (j = form.elements[i].options.length - 1; j >= 0; j--) {
                        field.options[j].selected = (data[field.name].indexOf(field.options[j].value) != -1);
                    }
                } else if (field.type == 'checkbox') { // le checkbox est particulier : value est toujours le même qu'il soit sélectionné ou pas. A la place, on prend .checked
                    field.checked = data[field.name];
                } else if (field.type == 'radio') {
                    if (field.checked !== (data[field.name] === field.value)) {
                        field.checked = (data[field.name] === field.value) // coche le champ dont la valeur est la même que celle dans data
                    }
                } else { // cas général : c'est value qui contient ce qui est visible à l'utilisateur
                    field.value = data[field.name];
                }
            }
        }
    }

    async function serializeArray(form) {
        let field, s = [];
        if (typeof form == 'object' && form.nodeName == "FORM") {
            const len = form.elements.length;
            for (i = 0; i < len; i++) {
                field = form.elements[i];
                if (field.name && !field.disabled && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
                    if (field.type == 'select-multiple') {
                        for (j = form.elements[i].options.length - 1; j >= 0; j--) {
                            if (field.options[j].selected)
                                s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[j].value);
                        }
                    } else if (field.type == "file") {
                        let out = [];
                        for (let i = 0; i < field.files.length; i++) {
                            let f = {};
                            for (let k in field.files[i]) {
                                switch (k) {
                                    case "arrayBuffer":
                                    case "slice":
                                    case "stream":
                                    case "text":
                                        break;
                                    default:
                                        f[k] = field.files[i][k];
                                }
                            }
                            let buf = await field.files[0].arrayBuffer();

                            f.base64 = await new Promise((r) => { const reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(new Blob([new Uint8Array(buf)])); })
                            f.base64 = f.base64.slice(f.base64.indexOf(";base64,") + 8);
                            out.push(f);
                        }
                        s[s.length] = encodeURIComponent(field.name + "____encoded") + "=" + encodeURIComponent(JSON.stringify(out));
                    } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
                        s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value);
                    }
                }
            }
        } else if (typeof form == 'object' && form.constructor == {}.constructor) {
            for (key in form) {
                const value = form[key];
                if (value instanceof Array) {
                    for (i = 0; i < value.length; i++) {
                        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value[i]);
                    }
                } else {
                    s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
                }
            }
        } else {
            throw new Error("Invalid first parameter, not a FORM DOM element nor an object");
        }
        return s.join('&').replace(/%20/g, '+');
    }

    function reset(form) {
        if (!form || form.tagName != "FORM") {
            throw new Error("Invalid first parameter, not a FORM DOM element");
        }
        // cette fonction va aussi parcourir le formulaire et non pas parcourir data
        let len = form.elements.length;
        for (i = 0; i < len; i++) {
            field = form.elements[i];
            // le champ doit avoir un nom, avoir une entrée dans data, être activé, et être d'un type qui a un sens pour ce serializeObject
            if (field.name && !field.disabled && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
                if (field.type == "file") {
                    field.value = null;
                } else if (field.type == 'select-multiple') { // le select multiple est particulier car il faut un tableau pour retenir les différentes options sélectionnées
                    for (j = form.elements[i].options.length - 1; j >= 0; j--) {
                        field.options[j].selected = (j == 0);
                    }
                } else if (field.type == 'checkbox') { // le checkbox est particulier : value est toujours le même qu'il soit sélectionné ou pas. A la place, on prend .checked
                    field.checked = false;
                } else if (field.type == 'radio') {
                    field.checked = false;
                } else { // cas général : c'est value qui contient ce qui est visible à l'utilisateur
                    field.value = "";
                }
            }
        }
    }

    function isElement(element) {
        return element instanceof Element || element instanceof HTMLDocument;
    }

    function ajax({ url, type, data, success, error, mimeType, pending, progress }) {
        if (url === undefined && ("url" in mispaf.ajaxDefault)) url = mispaf.ajaxDefault.url;
        if (type === undefined && ("type" in mispaf.ajaxDefault)) type = mispaf.ajaxDefault.type;
        if (success === undefined && ("success" in mispaf.ajaxDefault)) success = mispaf.ajaxDefault.success;
        if (error === undefined && ("error" in mispaf.ajaxDefault)) error = mispaf.ajaxDefault.error;
        if (mimeType === undefined && ("mimeType" in mispaf.ajaxDefault)) mimeType = mispaf.ajaxDefault.mimeType;
        if (pending === undefined && ("pending" in mispaf.ajaxDefault)) pending = mispaf.ajaxDefault.pending;
        if (progress === undefined && ("progress" in mispaf.ajaxDefault)) progress = mispaf.ajaxDefault.progress;

        if (type === undefined) type = "GET";
        if (url === undefined) url = ".";
        const xmlhttp = new XMLHttpRequest();

        function getPending() {
            if (pending) {
                let v = parseInt(pending.getAttribute("data-count"));
                if (!isNaN(v)) return v;
            }
            return 0;
        }

        function setPending(v) {
            if (pending) {
                pending.setAttribute("data-count", v);
            }
        }

        function decPending() {
            if (pending) {
                let c = getPending() - 1;
                if (c <= 0) {
                    pending.style.display = "none";
                    setPending(0);
                } else {
                    setPending(c);
                }
            }
        }

        function incPending() {
            if (pending) {
                let c = getPending() + 1;
                setTimeout(() => {
                    if (getPending() > 0) pending.style.display = "block";
                }, 100); // avoid flashing the pending icon
                setPending(c);
            }
        }

        function getResponse() {
            if (xmlhttp.getResponseHeader('content-type') && xmlhttp.getResponseHeader('content-type').startsWith("application/json")) {
                try {
                    return JSON.parse(xmlhttp.responseText);
                } catch (e) {
                    if (error !== undefined) {
                        error(xmlhttp.responseText, xmlhttp.status, xmlhttp);
                        success = undefined; error = undefined;
                    } else {
                        throw e;
                    }
                }
            } else {
                return xmlhttp.responseText;
            }
        }

        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
                decPending();
                if (xmlhttp.status == 200) {
                    if (success !== undefined) {
                        success(getResponse());
                        success = undefined; error = undefined;
                    }
                }
                else {
                    if (error !== undefined) {
                        error(getResponse(), xmlhttp.status, xmlhttp);
                        success = undefined; error = undefined;
                    }
                }
            }
        };
        xmlhttp.onabort = function () {
            decPending();
            if (error !== undefined) {
                error(null, "abort", xmlhttp);
                success = undefined; error = undefined;
            }
        }
        xmlhttp.onerror = function () {
            decPending();
            if (error !== undefined) {
                error(null, "error", xmlhttp);
                success = undefined; error = undefined;
            }
        }

        if (progress) {
            xmlhttp.onprogress = function (event) {
                progress(event.loaded, event.total, event);
            }
        }

        let toSend = undefined;
        xmlhttp.open(type, url, true);
        (async () => {
            if (data !== undefined) {
                if (isElement(data)) { // force mimeType for forms
                    if (data.nodeName == "FORM") {
                        mimeType = 'application/x-www-form-urlencoded';
                        toSend = await serializeArray(data);
                    } else throw new Error("Cannot make ajax call with this data");
                } else if (mimeType === undefined) { // guess a mimeType depending on data
                    if (typeof data === "string" || data instanceof String || typeof data === "number" || data instanceof Number) {
                        mimeType = 'text/plain';
                        toSend = "" + data;
                    } else {
                        mimeType = 'application/x-www-form-urlencoded';
                        toSend = await serializeArray(data);
                    }
                } else if (mimeType === 'application/json') {
                    toSend = JSON.stringify(data);
                } else if (mimeType === 'application/x-www-form-urlencoded') {
                    toSend = await serializeArray(data);
                }
                if (mimeType === undefined) {
                    throw new Error("Cannot make ajax call with this data");
                }
            }
            if (mimeType !== "undefined") xmlhttp.setRequestHeader('Content-Type', mimeType);
            incPending();
            xmlhttp.send(toSend);
        })();
    }

    function validateNotEmpty(form, fields, msg) {
        if (!form || form.tagName != "FORM") {
            throw new Error("Invalid first parameter, not a FORM DOM element");
        }
        const data = mispaf.serializeObject(form);
        let withError = false;
        for (let i = 0; i < fields.length; i++) {
            const name = fields[i];
            if (data[name] !== undefined && data[name].length === 0) { // ce champ est vide
                setFieldError(form, name, msg);
                withError = true;
            } else {
                setFieldError(form, name, null);
            }
        }
        return withError;
    }

    function setFieldError(form, name, msg) {
        if (!form || form.tagName != "FORM") {
            throw new Error("Invalid first parameter, not a FORM element");
        }
        // cherche le message d'erreur qui suit le champ de ce nom
        const namefields = form.querySelectorAll('[name="' + name + '"]');
        if (namefields.length == 0) {
            throw new Error("Missing element with name: " + name);
        }
        const namefield = namefields[namefields.length - 1];
        let error = form.querySelector('[name="' + name + '"] + .error');
        if (msg != null) {
            // est-il présent ?
            if (error === null) { // non : le créer
                error = document.createElement("div"); // <div class="error">
                error.setAttribute("class", "error");
                // trouver le dernier champ du formulaire possédant ce nom
                namefield.parentNode.insertBefore(error, namefield.nextSibling);
                namefield.parentNode.classList.remove("hasError");
                namefield.parentNode.classList.add("hasError");
            } else { // oui : le vider
                error.innerHTML = "";
            }
            const text = document.createTextNode(msg);
            error.appendChild(text);
        } else if (error !== null) { // ce message d'erreur doit disparaître
            namefield.parentNode.classList.remove("hasError");
            error.parentNode.removeChild(error);
        }
    }

    function clearErrors(form) {
        if (!form || form.tagName != "FORM") {
            throw new Error("Invalid first parameter, not a FORM DOM element");
        }
        let els = form.querySelectorAll("div.error");
        for (let i = 0; i < els.length; i++) {
            els[i].parentElement.removeChild(els[i]);
        }
        els = form.querySelectorAll("div.hasError");
        for (let i = 0; i < els.length; i++) {
            els[i].classList.remove("hasError");
        }
    }

    function ajaxError(error) {
        if (error === undefined) throw "Paramètre manquant";
        return function (response, status) {
            error.innerText = formatError(response, status);
        }
    }

    function formatError(response, status) {
        if ((typeof response == 'string' || response instanceof "String") && response.indexOf("<!--") == 0) {
            const end = response.indexOf("-->");
            if (end > 0) {
                response = response.substr(4, end - 4);
            }
        }
        if (response == '' || response == null || response == undefined) {
            return "Erreur inconnue (" + status + ")";
        } else {
            return response;
        }
    }

    function parentElement(el, sel) {
        el = el.parentElement;
        while (el != null && !el.matches(sel)) el = el.parentElement;
        return el;
    }

    let listeners = {};
    function addPageListener(event, callback) {
        if (!(event in listeners)) listeners[event] = [];
        listeners[event].push(callback);
    }

    function removePageListener(event, callback) {
        if (callback === undefined) {
            delete listeners[event];
        } else {
            if (!(event in listeners)) return; // cannot remove that which is not there
            let idx = listeners[event].indexOf(callback);
            if (idx != -1) {
                listeners[event].splice(idx, 1);
            }
        }
    }

    function fireEvent(name, event, cond, parameter) {
        let callbacks = listeners[name];
        if (callbacks) for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](event, parameter);
            if (!cond()) return;
        }
    }

    function page() {
        if (arguments.length == 0) {
            let el = document.querySelector('.page.active');
            if (el) return el.getAttribute('id');
            return null;
        } else {
            let keepgoing = true;
            let event = (() => {
                function stopPropagation() { keepgoing = false; }
                return { stopPropagation, preventDefault: stopPropagation };
            });
            let target = arguments[0];
            let current = page();
            event.leave = current;
            if (current && current != target) {
                let el = document.getElementById(current);
                if (!(el.matches || el.matchesSelector).apply(el, [".modal"])) {
                    event.leavePage = current;
                }
            }
            event.enter = target;
            event.target = document.getElementById(target);
            let el = document.querySelector('.page#' + target);
            if (el == null) throw new Error("Invalid page: the DOM element must have the class 'page' and the id '" + page + "'");
            if (current !== null) {
                fireEvent('leave', event, () => keepgoing);
                if (!keepgoing) return;
                fireEvent('leave:' + current, event, () => keepgoing);
                if (!keepgoing) return;
            }
            event.page = target;
            fireEvent('enter', event, () => keepgoing, arguments[1]);
            if (!keepgoing) return;
            fireEvent('enter:' + target, event, () => keepgoing, arguments[1]);
            if (!keepgoing) return;
            if ((el.matches || el.matchesSelector).apply(el, [".modal"])) {
                // this is a modal page => keep on showing current page + place hider to prevent interaction outside of this new page
                let hider = document.querySelector(".hider");
                if (hider) {
                    // there is already an hider => keep it as well as the page already blured, remove the current modal dialog and show the new one
                    if (current !== null) document.querySelector('#' + current).classList.remove("active");
                    // show new page
                    el.classList.add("active");
                } else {
                    hider = document.createElement("DIV");
                    hider.classList.add("hider");
                    document.body.appendChild(hider);
                    if (current !== null) {
                        document.querySelector('#' + current).classList.remove("active");
                        document.querySelector('#' + current).classList.add("blurred");
                    }
                }
            } else {
                let blurred = document.querySelectorAll(".page.blurred");
                for (let i = 0; i < blurred.length; i++) {
                    blurred[i].classList.remove('blurred');
                }
                let hider = document.querySelector(".hider");
                if (hider) hider.parentElement.removeChild(hider);
                // hide previous page
                if (current !== null) document.querySelector('#' + current).classList.remove("active");
            }
            // show new page
            el.classList.add("active");
            // update menu : remove old tag
            let elems = document.querySelectorAll('.menuSelected');
            for (let i = 0; i < elems.length; i++) elems[i].classList.remove("menuSelected");
            // update menu : set new tag
            elems = document.querySelectorAll('a[href="#' + target + '"]');
            for (let i = 0; i < elems.length; i++) elems[i].classList.add("menuSelected");
            // manage history ?
            if (mispaf.enableHistory === true) {
                history.pushState({}, "", "#" + target);
            }
        }
    }

    function setMenu(menu) {
        let elems = menu.querySelectorAll('a[href]');
        for (let i = 0; i < elems.length; i++) {
            let href = elems[i].getAttribute("href");
            if (href && href.startsWith("#") && href.length > 1) {
                elems[i].addEventListener('click', (event) => {
                    let target = document.querySelector('.page' + href);
                    if (target != null) { // this is a link to a proper page
                        event.preventDefault();
                        event.stopPropagation();
                        page(href.substring(1));
                    }
                });
            }
        }
    }

    let span = document.createElement("SPAN");

    function escape(text) {
        span.innerText = text;
        return span.innerHTML;
    }

    function unescape(text) {
        span.innerHTML = text;
        return span.innerText;
    }

    function addPage(config) {
        if (!config.id || !(typeof config.id == "string") || !/^[a-z]/.test(config.id.test)) {
            throw new Error("Missing or invalid id");
        }
        let page;
        if ("html" in config) {
            if (document.getElementById(name) != null) {
                throw new Error("Cannot create page " + name + " as it is already present in the DOM");
            }
            page = document.createElement("DIV");
            page.setAttribute("class", "page");
            page.setAttribute("id", config.id);
            page.innerHTML = config.html;
            document.querySelector(".pages").appendChild(page);
        } else {
            page = document.getElementById(config.id);
        }
        if (config.type == "modal") {
            page.classList.add("modal");
        }
        if ("class" in config) {
            page.classList.add(config.class);
        }
        let map = {};
        let proxy = new Proxy(page, {
            get(_, prop) {
                if (prop in page) {
                    return Reflect.get(...arguments);
                } else if (prop in map) {
                    if (prop.length > 1 && prop.endsWith("s")) {
                        return page.querySelectorAll(map[prop]);
                    } else {
                        return page.querySelector(map[prop]);
                    }
                } else {
                    if (prop.length > 1 && prop.endsWith("s")) {
                        return page.querySelectorAll('[data-id="' + prop + '"]');
                    } else {
                        return page.querySelector('[data-id="' + prop + '"]');
                    }
                }
            }
        })

        const isArrowFn = (fn) => {
            if (typeof fn !== 'function') return false;
            let ts = fn.toString();
            let idx = 0;
            while (idx < ts.length && ts.charAt(idx) != ")") {
                if (ts.charAt(idx) == "'") {
                    idx++;
                    while (idx < ts.length && ts.charAt(idx) != "'") {
                        if (ts.charAt(idx) == "\\") idx++;
                        idx++;
                    }
                }
                idx++;
            }
            ts = ts.substring(idx + 1).trim();
            return ts.startsWith("=>");
        }

        function wrap(obj, prop, preventDefault = false) {
            if (isArrowFn(obj[prop])) {
                throw new Error("A proper function is required, but an arrow function (=>) was provided for " + prop + " for the page " + obj.id);
            }
            return function (event) {
                if (preventDefault) event.preventDefault();
                obj[prop].apply(proxy, arguments);
            }
        }
        let after = [];
        for (let k in config) {
            switch (k) {
                case "id":
                case "html":
                case "page":
                case "type":
                case "class":
                    break;
                case "create":
                    after.push(config[k]);
                    break;
                case "enter":
                    mispaf.addPageListener("enter:" + config.id, wrap(config, k));
                    break;
                case "leave":
                    mispaf.addPageListener("leave:" + config.id, wrap(config, k));
                    break;
                case "map":
                    map = config[k];
                    break;
                default:
                    let idx = k.indexOf(":");
                    if (idx < 0) {
                        throw new Error("Invalid parameter " + k);
                    }
                    let evt = k.substring(0, idx);
                    let tgt = k.substring(idx + 1);
                    after.push(() => {
                        let items = page.querySelectorAll(tgt);
                        for (let i = 0; i < items.length; i++) {
                            items[i].addEventListener(evt, wrap(config, k, true));
                        }
                    });
            }
        }
        if (after.length > 0) {
            // wait a bit for the browser to insert the page if needed
            setTimeout(async () => {
                for (let i = 0; i < after.length; i++) {
                    let event = {
                        stopPropagation() { },
                        preventDefault() { },
                        leave: null,
                        enter: config.id,
                        target: page
                    };
                    await after[i](event);
                }
            }, 1);
        }
        return proxy;
    }

    async function api(url, payload) {
        return new Promise((resolve, reject) => {
            mispaf.ajax({
                url,
                type: 'POST',
                data: payload,
                success(response) { resolve(response); },
                error(message, status) {
                    reject(new HTTPError(message, status));
                }
            })
        });
    }

    return {
        serializeObject,
        serializeArray,
        deserializeObject,
        validateNotEmpty,
        setFieldError,
        clearErrors,
        ajax,
        ajaxError,
        ajaxDefault: {},
        formatError,
        parentElement,
        page,
        addPageListener,
        removePageListener,
        setMenu,
        escape,
        reset,
        unescape,
        addPage,
        api
    }

})();