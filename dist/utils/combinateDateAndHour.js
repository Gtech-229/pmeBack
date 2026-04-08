"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineDateAndTime = void 0;
const combineDateAndTime = (date, time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
};
exports.combineDateAndTime = combineDateAndTime;
//# sourceMappingURL=combinateDateAndHour.js.map