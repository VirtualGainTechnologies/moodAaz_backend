const service = require("./address.service");

exports.addAddress = async (req,res) => {
  const result = await service.addAddress({
    userId: req.user._id,
    ...req.body
  })
  res.status(201).json({
    message: "Address added successfully",
    error: false,
    data:result
  })
};

exports.getAddresses = async(req,res) => {
  const result = await service.getAddresses(req.user._id)
   res.status(200).json({
    message: "Addresses fetched successfully",
    error: false,
    data:result
  })
};

exports.updateAddress = async (req,res) => {
  const result = await service.updateAddress({
    userId: req.user._id,
    addressId: req.params.id,
    ...req.body
  })
   res.status(200).json({
    message: "Address updated successfully",
    error: false,
    data:result
  })
};

exports.deleteAddress = async (req,res) => {
  const result = await service.deleteAddress({
    userId: req.user._id,
    addressId: req.params.id
  })
   res.status(200).json({
    message: "Address deleted successfully",
    error: false,
    data:result
  })
};

exports.setDefault = async (req,res) => {
  const result = await service.setDefault({
    userId: req.user._id,
    addressId: req.params.id
  })
   res.status(200).json({
    message: "Default address updated successfully",
    error: false,
    data: result
  })
};