const repo = require("./media.repository");
const AppError = require("../../utils/app-error");
const { deleteFile, uploadPublicFile } = require("../../services");
const cache = require("./media.cache");

exports.createMedia = async (payload, file) => {
  const { type, name } = payload;
  const uploadResult = await uploadPublicFile(file, type, 7);
  if (!uploadResult) {
    throw new AppError(400, "Failed to upload file");
  }

  const media = await repo.create({
    type,
    name,
    key: uploadResult.key,
  });
  if (!media) {
    throw new AppError(400, "Failed to create media");
  }
  await cache("LIST").invalidate(type);

  return media;
};

exports.deleteMedia = async (mediaId) => {
  const media = await repo.findById(mediaId, "key type", { lean: true });
  if (!media) {
    throw new AppError(404, "Media not found");
  }

  // delete from S3 & DB
  await deleteFile(media.key);
  const deleted = await repo.deleteById(mediaId);
  if (!deleted) {
    throw new AppError(400, "Failed to delete media record");
  }
  await cache("LIST").invalidate(media.type);
  return true;
};

exports.getMedia = async (type) => {
  const cached = await cache("LIST").get(type);
  if (cached) return cached;

  const media = await repo.findMany(
    {
      is_active: true,
      ...(type && { type: type.toUpperCase() }),
    },
    "_id image type name key",
    {
      lean: true,
      virtuals: true,
    },
  );
  if (!media) {
    throw new AppError(400, "Failed to fetch media");
  }
  await cache("LIST").set(type, media);
  return media;
};
