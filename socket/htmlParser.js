const fs = require('fs');
const { JSDOM } = require('jsdom');

module.exports = (file_path) => {
    try {
        const data = fs.readFileSync(file_path, 'utf8'); // 동기적 파일 읽기
        const dom = new JSDOM(data); // JSDOM 인스턴스를 data로 초기화
        return dom.window.document.body.innerHTML; // body 내용만 반환
    } catch (err) {
        console.error('Error reading file:', err);
        throw err; // 에러 발생 시 throw
    }
};