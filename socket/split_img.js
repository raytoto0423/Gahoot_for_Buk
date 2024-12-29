const webSocket = require('ws')
const vote = require('./vote.js')

const path = require("path");
const fs = require('fs');
const folderPath = path.join(__dirname, "..", "db_char");

let imageFiles = [];
let winner = []; // 각 라운드의 승자를 저장
let round = 0; // 현재 라운드
let SelectedImages = [];
let currentselectedImages = [];

try {
    const files = fs.readdirSync(folderPath);
    imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log("이미지 파일이 없습니다.");
    }

} catch (err) {
    console.error(`폴더를 읽는 중 오류 발생 (${folderPath}):`, err);
}

function shuffle(array = []) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 다음 라운드 시작
function nextRound(ws) {
    if (imageFiles.length <= 1) {
        console.log('here')
        if (winner.length === 1) {
            console.log('end')
            ws.send(JSON.stringify({
                action: "ending",
                winner: winner[0], // 최종 우승자
                message: "투표가 종료되었습니다!"
            }));
        } else {
            imageFiles = winner;
            SelectedImages = [];
            winner = [];
        }
        return
    }

    // 승자 리스트에서 다음 라운드
    imageFiles = [...winner]; // 승자들이 다음 라운드로 이동
    winner = []; // 승자 리스트 초기화
    round++; // 라운드 증가

    handleRestart(ws); // 다음 라운드 시작
}

function handleRestart(ws) {
    if (imageFiles.length < 2) {
        nextRound(ws);
        if (imageFiles.length === 1) {
            return;
        }
    }

    const shuffledImages = shuffle([...imageFiles]);
    currentselectedImages = shuffledImages.slice(0, 2); // 후보 2명 선택
    imageFiles = imageFiles.filter(file => !currentselectedImages.includes(file)); // 선택된 이미지 제외

    SelectedImages.push(...currentselectedImages);
    console.log("새 라운드 후보 이미지:", SelectedImages);

    ws.send(JSON.stringify({
        action: "restart",
        vote1: `/db_char/${currentselectedImages[0]}`,
        vote2: `/db_char/${currentselectedImages[1]}`,
        url: "/template_for_admin.html"
    }));
}

function addWinner(winningImage_int) {
    winner.push(currentselectedImages[winningImage_int]); // 승자 리스트에 추가
}

module.exports = { handleRestart, nextRound, SelectedImages, addWinner, winner, currentselectedImages };
