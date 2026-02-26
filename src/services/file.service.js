const sharp = require("sharp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const {
  s3,
  env: { NODE_ENV, AWS_REGION, PROD_PUBLIC_SPACE_NAME, TEST_PUBLIC_SPACE_NAME },
} = require("../config");

// helpers
const resize = async (file, maxSizeMB) => {
  if (!maxSizeMB || !file?.buffer) return file.buffer;
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= maxBytes) return file.buffer;
  return sharp(file.buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .toBuffer();
};

const generateS3Key = ({ originalName, type }) => {
  if (!originalName || !type) {
    throw new Error("INVALID_S3_KEY_INPUT");
  }
  const ext = path.extname(originalName).toLowerCase();
  const now = new Date();
  return [
    "media",
    type.toLowerCase(),
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    `${uuidv4()}${ext}`,
  ].join("/");
};

const BUCKET =
  NODE_ENV === "PRODUCTION" ? PROD_PUBLIC_SPACE_NAME : TEST_PUBLIC_SPACE_NAME;
const buildPublicUrl = (key) =>
  `https://${BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

// public upload
exports.uploadPublicFile = async (file, type, maxSizeMB) => {
  if (!file) throw new Error("FILE_REQUIRED");
  if (!type) throw new Error("MEDIA_TYPE_REQUIRED");

  const buffer = await resize(file, maxSizeMB);
  const key = generateS3Key({
    originalName: file.originalname,
    type,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }),
  );

  return {
    url: buildPublicUrl(key),
    key,
  };
};

// multiple public upload
exports.uploadMultiplePublicFiles = async (files = [], type, maxSizeMB) => {
  if (!Array.isArray(files) || !files.length) return [];
  return Promise.all(
    files.map((file) => exports.uploadPublicFile(file, type, maxSizeMB)),
  );
};

// private upload
exports.uploadPrivateFile = async (file, type, maxSizeMB) => {
  if (!file) throw new Error("FILE_REQUIRED");
  const buffer = await resizeImageIfNeeded(file, maxSizeMB);
  const key = generateS3Key({
    originalName: file.originalname,
    type,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: "private",
    }),
  );

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 10 * 60 }, // 10 minutes
  );
  return { signedUrl, key };
};

// delete file
exports.deleteFile = async (key) => {
  if (!key) throw new Error("S3_KEY_REQUIRED");
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      throw new Error("S3_OBJECT_NOT_FOUND");
    }
    throw error;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
};

// delete multiple files
exports.deleteMultipleFiles = async (keys = []) => {
  if (!Array.isArray(keys) || !keys.length) return;
  await Promise.all(keys.map((key) => exports.deleteFile(key)));
};
