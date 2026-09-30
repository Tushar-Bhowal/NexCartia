import multer from "multer";
import ErrorHandler from "../utils/utility-class.js";

export const mutliUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new ErrorHandler("Only image files can be uploaded", 400));
  },
}).array("photos", 5);
