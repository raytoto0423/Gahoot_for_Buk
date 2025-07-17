const webSocket = require('ws');
const loginHandler = require('../loginHandler');
const fs = require('fs')
const path = require('path')
const votes = require('./vote.js');
const htmlParser = require('./htmlParser.js');
const splitImg = require('./split_img.js');
const {currentselectedImages, addWinner, winner} = require("./split_img");

let sockets = []
let admin_acc
let voteInterval;

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            return [key, decodeURIComponent(value)];
        })
    );
}

module.exports = (server, db) => {
    const wss = new webSocket.Server({ server: server });

    wss.on('connection', (ws, req) => {
        const cookies = parseCookies(req.headers.cookie);
        const USER_COOKIE_KEY = "USER"
        console.log(cookies)
        if (!loginHandler.checkCookieFromHTTPRequest(req, USER_COOKIE_KEY)) {
            ws.close(1008, "Authentication Failed");
            return;
        }
        ws.id = req.headers['sec-websocket-key']
        sockets.push(ws)
        console.log("CONNECTED: ", sockets.length)

        const user_data = JSON.parse(cookies[USER_COOKIE_KEY])

        console.log(req.headers.cookie);

        if (user_data.password === 'wlqrkrhtlvek') {
            admin_acc = ws
            // 실시간 투표 현황 전송
            voteInterval = setInterval(() => {
                if (votes.vote_started && admin_acc && admin_acc.readyState === 1) {
                    const currentResult = votes.get_vote()[0];
                    const voterCount = votes.get_vote()[1];  // 투표한 인원 수
                    const totalUsers = votes.get_total_user_count();

                    admin_acc.send(JSON.stringify({
                        action: "progress",
                        result: currentResult,
                        voterCount: voterCount,
                        totalUsers: totalUsers
                    }));
                }
            }, 3000);
            ws.on('message', (res) => {
                const message = JSON.parse(res.toString());
                if (message.action === "startVote") { // 투표 시작
                    console.log("start vote")
                    votes.reset_vote()
                    sockets.forEach(cl => {
                        if (cl.id !== admin_acc.id) {
                            cl.send(JSON.stringify({ action: 'redirect', url: '/template_for_user.html' }))
                        } else {
                            cl.send(JSON.stringify({ action: 'redirect', url: '/template_for_admin.html' }))
                            splitImg.handleRestart(ws);
                        }
                    })
                    votes.vote_started = true
                } else if (message.action === "end_vote") { // 투표 종료 시
                    console.log("end vote")
                    let results = votes.get_vote();
                    results = results[0];
                    admin_acc.send(JSON.stringify({ action: 'result', url: '/vote_graph_admin.html', result: results }));
                    votes.vote_started = false
                } else if (message.action === "addWinner") {
                    if (message.winner === 1) {
                        addWinner(0);
                    } else if (message.winner === 2) {
                        addWinner(1);
                    } else {
                        const randomChoice = Math.floor(Math.random() * 2);
                        addWinner(randomChoice);
                    }
                    console.log(winner)
                } else if (data.action === "ending") {
                    // 승자 정보와 메시지를 가져옴
                    const winner = data.winner;
                    const message = data.message;

                    // URL 변경 (ending.html로 리디렉션)
                    window.location.href = "/ending.html?winner=" + encodeURIComponent(winner) + "&message=" + encodeURIComponent(message);
                }
            });
        } else {
            const acc = user_data.username;
            votes.register_user(acc);

            ws.on('message', (req) => {
                const msg = JSON.parse(req.toString());
                const acc = JSON.parse(decodeURIComponent(msg.acc)).username; /* TODO: msg.acc에 있는 username이 파싱되지 않은 채로 오므로 파싱되어서 오도록 변경할 것 */
                if (msg.action === "vote") {
                    console.log("vote", msg)
                    if (!votes.acc_exist(acc)) {
                        if (loginHandler.db.get(acc)) {
                            votes.vote(msg.num, acc);
                            console.log(votes.get_vote())
                            ws.send(JSON.stringify({ action: 'wait', url: '/waiting.html' }));
                        }
                        else ws.send(`<script>alert("로그인 정보 오류. 다시 로그인하세요.")</script>`)
                    } else ws.send(`<script>alert("재투표할 수 없습니다.")</script>`)
                }
            });
        }
        
        ws.on('close', (code, reason)=>{
            sockets = sockets.filter(v => {
                return ws.id !== v.id
            })
            if (ws.id === admin_acc) {
                admin_acc = null
            }
            if (voteInterval) {
                clearInterval(voteInterval);
                voteInterval = null;
            }
            console.log(sockets.length, code, reason)
        })
    })
}