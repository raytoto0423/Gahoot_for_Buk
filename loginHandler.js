const express = require('express')
const path = require('path')
const USER_COOKIE_KEY = 'USER'
let db = new Map()

function cookieExists(req) {
    if (req.cookies) {
        if (req.cookies[USER_COOKIE_KEY]) {
            return true
        }
    }
    return false
}

function checkCookie(req) {
    if (cookieExists(req)) {
        const user = JSON.parse(req.cookies[USER_COOKIE_KEY])
        if (db.get(user.username)) {
            return true
        }
    }
    return false
}

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            return [key, decodeURIComponent(value)];
        })
    );
}

function checkCookieFromHTTPRequest(req, cookieName) {
    // req.headers.cookie는 쿠키들을 문자열로 포함
    const cookies = req.headers.cookie;
    if (!cookies) {
      // 쿠키가 없는 경우
      return false;
    }
  
    const cookie = parseCookies(cookies)
    const cookie_value = JSON.parse(cookie[cookieName])

    if (db.get(cookie_value.username)) return true;
    else if (cookie_value.password==="wlqrkrhtlvek") return true;
  
    // 쿠키를 찾지 못한 경우 null 반환
    return false;
}

function existIn(li, ele) { return li.indexOf(ele) > -1 }
function getCookie(req) { return JSON.parse(req.cookies[USER_COOKIE_KEY]); }
function removeCookie(res) { res.clearCookie(USER_COOKIE_KEY); }
function addCookie(data, res) { res.cookie(USER_COOKIE_KEY, JSON.stringify(data)); }

function secureStatic(paths) {
    let statics = express.static(path.join(__dirname, 'secure'));
    return (req, res, next) => {
        if (!paths.hasOwnProperty(req.path)) {
            return statics(req, res, next);
        }

        if (paths[req.path] === 'USER') {
            if (!checkCookie(req)) {
                return res.status(403).send('<h1>403 Forbidden</h1>');
            } else {
                return statics(req, res, next);
            }
        } else if (paths[req.path] === 'ADMIN') {
            if (req.cookies[USER_COOKIE_KEY]) {
                if (getCookie(req).password === 'wlqrkrhtlvek') {
                    return statics(req, res, next);
                }
            } else {
                return res.status(403).send('<h1>403 Forbidden</h1>');
            }
        } else {
            throw new Error('Invalid auth type');
        }
    };
}


module.exports = {
    checkCookie,
    getCookie,
    removeCookie,
    addCookie,
    secureStatic,
    cookieExists,
    existIn,
    db,
    checkCookieFromHTTPRequest
};