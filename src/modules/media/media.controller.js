const AppError = require("../../utils/app-error");
const service = require("./media.service");

exports.createMedia = async (req, res) => {
  const result = await service.createMedia(req.body, req.file);
  if (!result) {
    throw new AppError(400, "Failed to add media");
  }

  res.status(201).json({
    message: "Media added successfully",
    error: false,
    data: result,
  });
};

exports.deleteMedia = async (req, res) => {
  const result = await service.deleteMedia(req.params.id);
  if (!result) {
    throw new AppError(400, "Failed to delete media");
  }

  res.status(200).json({
    message: "Media deleted successfully",
    error: false,
    data: null,
  });
};
