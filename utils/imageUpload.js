const multer = require("multer");
const slugify = require("slugify");
const otpGenerator = require("otp-generator");
const sharp = require("sharp");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const AppError = require("./AppError");

// getDate
const date = new Date();
const dd = String(date.getDate()).padStart(2, "0");
const mm = String(date.getMonth() + 1).padStart(2, "0");
const yyyy = date.getFullYear();
const DATE = `${dd}-${mm}-${yyyy}`;

// middlewear  function
const uploadImage = multer({
  storage: multer.memoryStorage({
    destination: (req, file, callback) => callback(null, ""),
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Not an image! Please upload only images"), false);
    }
  },
});

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.SPACE_ACCESS_KEY,
    secretAccessKey: process.env.SPACE_SECRET_ACCESS_KEY,
  },
});

const uploadPublicFile = async (file, userName, maxSize) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSizeBytes = maxSize * 1024 * 1024;

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      message: "Image must be of .jpg or .jpeg or .png",
      error: true,
      data: null,
    };
  }

  let fileBuffer = file.buffer;
  if (maxSize && file.size > maxSizeBytes) {
    return {
      message: `Image must be less than ${maxSize}MB`,
      error: true,
      data: null,
    };
    //fileBuffer = await sharp(file.buffer).resize({ width: 800 }).toBuffer();
  }

  //generate unique id
  const id = otpGenerator.generate(3, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const key = `${slugify(userName, {
    replacement: "_",
    lower: true,
    strict: true,
  })}-${DATE}-${id}-${slugify(file.originalname, {
    replacement: "_",
    lower: true,
    strict: true,
  })}`;

  const params = {
    ACL: "public-read",
    Bucket:
      process.env.NODE_ENV === "PRODUCTION"
        ? process.env.PROD_PUBLIC_SPACE_NAME
        : process.env.TEST_PUBLIC_SPACE_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const url = `https://${
      process.env.NODE_ENV === "PRODUCTION"
        ? process.env.PROD_PUBLIC_SPACE_NAME
        : process.env.TEST_PUBLIC_SPACE_NAME
    }.s3.ap-south-1.amazonaws.com/${key}`;

    return {
      message: "File uploaded successfully",
      error: false,
      data: url,
    };
  } catch (err) {
    console.log("error in catch block of uploadPublicFile", err);
    return {
      message: err.message || "Error in uploading file",
      error: true,
      data: null,
    };
  }
};

const uploadMultiplePublicFile = async (files = [], userName, maxSize) => {
  try {
    let imageUrls = [];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return {
          message: "Image must be of .jpg or .jpeg or .png",
          error: true,
          data: null,
        };
      }
      const maxSizeBytes = maxSize * 1024 * 1024;

      let fileBuffer = file.buffer;
      if (maxSize && file.size > maxSizeBytes) {
        return {
          message: `Image must be less than ${maxSize}MB`,
          error: true,
          data: null,
        };
        // fileBuffer = await sharp(file.buffer).resize({ width: 800 }).toBuffer();
      }

      // generate unique id
      const id = otpGenerator.generate(3, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const key = `${slugify(userName, {
        replacement: "_",
        lower: true,
        strict: true,
      })}-${DATE}-${id}-${slugify(file.originalname, {
        replacement: "_",
        lower: true,
        strict: true,
      })}`;

      const params = {
        ACL: "public-read",
        Bucket:
          process.env.NODE_ENV === "PRODUCTION"
            ? process.env.PROD_PUBLIC_SPACE_NAME
            : process.env.TEST_PUBLIC_SPACE_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);

      await s3.send(command);

      const url = `https://${
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.PROD_PUBLIC_SPACE_NAME
          : process.env.TEST_PUBLIC_SPACE_NAME
      }.s3.ap-south-1.amazonaws.com/${key}`;

      imageUrls.push(url);
    }

    return {
      message: "File uploaded successfully",
      error: false,
      data: imageUrls,
    };
  } catch (err) {
    console.log("error in catch block of uploadMultiplePublicFile ====>", err);
    return {
      message: err.message || "Error in uploading file",
      error: true,
      data: null,
    };
  }
};

const uploadPrivateFile = async (file, userName, maxSize) => {
  try {
    let maxSizeBytes = maxSize * 1024 * 1024;
    let fileBuffer = file.buffer;
    if (maxSize && file.size > maxSizeBytes) {
      fileBuffer = await sharp(file.buffer).resize({ width: 800 }).toBuffer();
    }
    // generate unique Id
    const id = otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const params = {
      ACL: "private",
      Bucket:
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.PROD_PUBLIC_SPACE_NAME
          : process.env.TEST_PUBLIC_SPACE_NAME,
      Key: `${userName}-${DATE}-${id}-${file.originalname}`,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    const putCommand = new PutObjectCommand(params);
    await s3.send(putCommand);

    const signCommand = new GetObjectCommand({
      Bucket: params.Bucket,
      Key: params.Key,
    });

    const url = await getSignedUrl(s3, signCommand, { expiresIn: 10 * 60 });
    return {
      message: "Signed url created successfully",
      error: false,
      data: url,
    };
  } catch (err) {
    return {
      message: err.message || "Error in creating signed URL",
      error: true,
      data: null,
    };
  }
};

const deleteFile = async (key) => {
  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket:
        process.env.NODE_ENV === "PRODUCTION"
          ? process.env.PROD_PUBLIC_SPACE_NAME
          : process.env.TEST_PUBLIC_SPACE_NAME,
      Key: key,
    });
    await s3.send(deleteObjectCommand);
    return {
      message: "File deleted successfully",
      error: false,
      data: null,
    };
  } catch (err) {
    return {
      message: err.message || "Error in deleting file",
      error: true,
      data: null,
    };
  }
};

const deleteMultipleFiles = async (keys = []) => {
  try {
    for (const key of keys) {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket:
          process.env.NODE_ENV === "PRODUCTION"
            ? process.env.PROD_PUBLIC_SPACE_NAME
            : process.env.TEST_PUBLIC_SPACE_NAME,
        Key: key,
      });
      await s3.send(deleteObjectCommand);
    }

    return {
      message: "File deleted successfully",
      error: false,
      data: null,
    };
  } catch (err) {
    return {
      message: err.message || "Error in deleting file",
      error: true,
      data: null,
    };
  }
};

module.exports = {
  uploadImage,
  uploadExcel,
  uploadPublicFile,
  uploadMultiplePublicFile,
  uploadPrivateFile,
  deleteFile,
  deleteMultipleFiles,
};
