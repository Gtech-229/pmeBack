"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMeetingReport = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const buildPresenceListTemplate_1 = require("./templates/pdfs/buildPresenceListTemplate");
const os_1 = __importDefault(require("os"));
const getChromiumPath = () => {
    switch (os_1.default.platform()) {
        case 'win32':
            return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        // or try:
        // 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        case 'darwin':
            return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        case 'linux':
            return '/usr/bin/google-chrome';
        default:
            return undefined; // let puppeteer find it
    }
};
const generateMeetingReport = async (data) => {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(await (0, buildPresenceListTemplate_1.buildPresenceTemplate)(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1.5cm', bottom: '1.5cm', left: '2cm', right: '2cm' }
    });
    await browser.close();
    return Buffer.from(pdf);
};
exports.generateMeetingReport = generateMeetingReport;
//# sourceMappingURL=generateMeetingList.js.map