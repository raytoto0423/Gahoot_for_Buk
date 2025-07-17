const webSocket = require('ws')
const vote = require('./vote.js')

const path = require("path");
const fs = require('fs');
const folderPath = path.join(__dirname, "..", "db_char");

let allImages = []; // 처음 한번만 초기화
let imageFiles = [];
let winner = [];
let currentselectedImages = [];
let round = 0;

try {
    const files = fs.readdirSync(folderPath);
    allImages = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    imageFiles = shuffle([...allImages]);
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
            winner = [];
        }
        return
    }

    // 승자 리스트에서 다음 라운드
    imageFiles = [...winner]; // 승자들이 다음 라운드로 이동
    winner = []; // 승자 리스트 초기화
    SelectedImages = [];
    round++; // 라운드 증가

    handleRestart(ws); // 다음 라운드 시작
}
function handleRestart(ws) {
    // 라운드 종료 후 처리
    if (imageFiles.length < 2) {
        if (winner.length === 1) {
            console.log("end");
            ws.send(JSON.stringify({
                action: "ending",
                winner: winner[0],
                message: "투표가 종료되었습니다!"
            }));
            return;
        } else {
            // 다음 라운드로 승자들만 이동
            imageFiles = shuffle([...winner]);
            winner = [];
            round++;
        }
    }

    currentselectedImages = imageFiles.slice(0, 2);
    imageFiles = imageFiles.slice(2); // 앞 2개 제외하고 남은 걸 유지

    const stageText = getCurrentStage();

    console.log("새 라운드 후보 이미지:", currentselectedImages);

    ws.send(JSON.stringify({
        action: "restart",
        vote1: `/db_char/${currentselectedImages[0]}`,
        vote2: `/db_char/${currentselectedImages[1]}`,
        url: "/template_for_admin.html",
        stage: stageText
    }));
}

function addWinner(winningImage_int) {
    winner.push(currentselectedImages[winningImage_int]);
}

function getCurrentStage() {
    const total = imageFiles.length;
    console.log(total);

    if (total >= 64) return "64강";
    if (total >= 32) return "32강";
    if (total >= 16) return "16강";
    if (total >= 8)  return "8강";
    if (total >= 4)  return "4강";
    if (total === 2) return "결승";
    return "";
}

module.exports = {
    handleRestart,
    nextRound,
    addWinner,
    winner,
    currentselectedImages,
    getCurrentStage // ← 추가
}
