"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("./cloudinary"));
const uploadToCloudinary = (file, folder) => {
    return new Promise((resolve, reject) => {
        const options = {
            resource_type: 'auto'
        };
        if (folder) {
            options.folder = folder;
        }
        const stream = cloudinary_1.default.uploader.upload_stream(options, (error, result) => {
            if (error || !result) {
                return reject(error);
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type
            });
        });
        stream.end(file.buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
//# sourceMappingURL=UploadToCloudinary.js.map