// https://github.com/vavilon-js/vavilon.js
(function () {
    'use strict';

    function get(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (this.status < 300 && this.status >= 200 && callback) {
                callback(xhr.responseText);
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    }

    var Dictionary =  (function () {
        function Dictionary(url, strings) {
            if (strings === void 0) { strings = {}; }
            this.url = url;
            this.strings = strings;
        }
        Dictionary.prototype.hasString = function (id) {
            return this.strings.hasOwnProperty(id);
        };
        Dictionary.prototype.load = function (cb) {
            var _this = this;
            get(this.url, function (r) {
                _this.strings = JSON.parse(r);
                if (cb)
                    cb();
            });
        };
        return Dictionary;
    }());

    function getLocaleCookie() {
        var parts = ('; ' + document.cookie).split('; vavilon-locale=');
        if (parts.length === 2) {
            return parts[1].split(';')[0];
        }
        else {
            return null;
        }
    }
    function setLocaleCookie(locale) {
        var date = new Date();
        date.setTime(date.getTime() + (315360000000));
        var expires = "; expires=" + date.toUTCString();
        document.cookie = "vavilon-locale=" + (locale || '') + expires + "; path=/";
    }

    function getUserLocale() {
        return (getLocaleCookie() || window.navigator.language || window.browserLanguage || window.userLanguage).toLowerCase();
    }
    function getPageLocale() {
        return document.documentElement.lang.toLowerCase();
    }

    var Vavilon =  (function () {
        function Vavilon() {
            this.userLocale = getUserLocale();
            this.pageLocale = getPageLocale();
            this.elements = null;
            this.dictionaries = {};
            this.pageDict = null;
        }
        Vavilon.prototype.findAllElements = function () {
            this.elements = document.querySelectorAll('[data-vavilon]');
        };
        Vavilon.prototype.replaceAllElements = function () {
            var _this = this;
            if (this.elements && this.pageDict) {
                if (!this.dictionaries[this.pageLocale]) {
                    this.dictionaries[this.pageLocale] = new Dictionary(null);
                }
                Array.from(this.elements).forEach(function (el) {
                    var strId = el.dataset.vavilon;
                    if (_this.dictionaries[_this.pageDict].hasString(strId)) {
                        if (!_this.dictionaries[_this.pageLocale].hasString(strId)) {
                            _this.dictionaries[_this.pageLocale].strings[strId] = el.innerText;
                        }
                        var rawTranslation = _this.dictionaries[_this.pageDict].strings[strId];
                        var translationParts = rawTranslation.split(/\{\d+\}/g);
                        var elementTokens = rawTranslation.match(/\{\d+\}/g) || [];
                        var children = Array.from(el.children);
                        el.innerHTML = '';
                        translationParts.forEach(function (part, index) {
                            var textNode = document.createTextNode(part);
                            el.appendChild(textNode);
                            var token = elementTokens[index];
                            if (!token) return;
                            var index = Number(token.replace(/\D+/g, ''));
                            var child = children[index];
                            el.appendChild(child);
                        });
                    }
                });
            }
        };
        Vavilon.prototype.registerDictionaries = function () {
            var _this = this;
            Array.from(document.scripts)
                .filter(function (e) { return e.dataset.hasOwnProperty('vavilonDict'); })
                .forEach(function (ds) {
                var dictLocale = ds.dataset.vavilonDict.toLowerCase();
                _this.dictionaries[dictLocale] = new Dictionary(ds.src);
            });
        };
        Vavilon.prototype.loadDictionaries = function (primaryCb) {
            var _this = this;
            Object.keys(this.dictionaries)
                .forEach(function (loc) {
                if (loc === _this.userLocale || loc.slice(0, 2) === _this.userLocale.slice(0, 2) && !_this.pageDict) {
                    _this.pageDict = loc;
                    _this.dictionaries[loc].load(function () {
                        _this.pageDictLoaded = true;
                        primaryCb();
                    });
                }
                else {
                    _this.dictionaries[loc].load();
                }
            });
        };
        Vavilon.prototype.changeLocale = function (localeString) {
            if (this.dictionaries[localeString]) {
                this.pageDict = localeString;
                setLocaleCookie(this.pageDict);
                return true;
            }
            else if (this.dictionaries[localeString.slice(0, 2)]) {
                this.pageDict = localeString.slice(0, 2);
                setLocaleCookie(this.pageDict);
                return true;
            }
            return false;
        };
        return Vavilon;
    }());

    var vavilon = new Vavilon();
    var pageLoaded = false;
    vavilon.registerDictionaries();
    vavilon.loadDictionaries(function () {
        if (pageLoaded) {
            vavilon.replaceAllElements();
        }
    });
    window.onload = function () {
        vavilon.findAllElements();
        pageLoaded = true;
        if (vavilon.pageDictLoaded) {
            vavilon.replaceAllElements();
        }
    };
    function changeLocale(localeString) {
        localeString = localeString.toLowerCase();
        var changeSuccessful = vavilon.changeLocale(localeString);
        if (changeSuccessful) {
            vavilon.replaceAllElements();
        }
    }
    window.setLang = changeLocale;

}());
