import multer from 'multer'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application',
   'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error('Type de fichier non autorisé (PDF, DOC, DOCX uniquement)')
      )
    }
    cb(null, true)
  }
})
