const repo = require("./media.repository");
const AppError = require("../../utils/app-error");
const { deleteFile, uploadPublicFile } = require("../../services/file.service");

exports.createMedia = async (payload, file) => {
  const { type, name } = payload;
  const uploadResult = await uploadPublicFile(file, type, 7);
  if (!uploadResult) {
    throw new AppError(400, "Failed to upload file");
  }

  const media = await repo.create({
    type,
    name,
    url: uploadResult.url,
    s3_key: uploadResult.key,
  });
  if (!media) {
    throw new AppError(400, "Failed to create media");
  }

  return media;
};

exports.deleteMedia = async (mediaId) => {
  const media = await repo.findById(mediaId, "s3_key", { lean: true });
  if (!media) {
    throw new AppError(404, "Media not found");
  }

  // delete from S3 & DB
  await deleteFile(media.s3_key);
  const deleted = await repo.deleteById(mediaId);
  if (!deleted) {
    throw new AppError(400, "Failed to delete media record");
  }
  return true;
};
