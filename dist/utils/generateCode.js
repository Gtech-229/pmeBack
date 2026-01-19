"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = generateCode;
function generateCode(length) {
    if (length <= 0) {
        throw new Error("La longueur doit être supérieure à 0");
    }
    let code = "";
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10); // chiffre entre 0 et 9
    }
    return code;
}
//# sourceMappingURL=generateCode.js.map