const { S3Client } = require("@aws-sdk/client-s3");

const {
  AWS_REGION,
  SPACE_ACCESS_KEY,
  SPACE_SECRET_ACCESS_KEY,
} = require("./env.config");

module.exports = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: SPACE_ACCESS_KEY,
    secretAccessKey: SPACE_SECRET_ACCESS_KEY,
  },
});
