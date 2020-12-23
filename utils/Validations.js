const Joi = require("joi");

module.exports = {
  admin_Register: (data) => {
    const validation = Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6),
      role: Joi.string().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },

  // login: (data) => {
  //   const schema = Joi.object().keys({
  //     email: Joi.string().max(40).required().email(),
  //     password: Joi.string().min(8).max(255).required(),
  //   });

  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const err = new Error(error);
  //     err.status = error.status;
  //     throw err;
  //   }
  //   return value;
  // },
  register_Company: (data) => {
    const Company = Joi.object().keys({
      name: Joi.string().required(),
      deliveryPlace: Joi.string().required(),
    });

    const { error, value } = Company.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },
  edit_company: (data) => {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      deliveryPlace: Joi.string().required(),
    });
    const { error, value } = schema.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = 400;
      throw err;
    }
    return value;
  },
  register_package: (data) => {
    const validation = Joi.object().keys({
      offPrice: Joi.number().required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      credits: Joi.number().required(),
      expiration: Joi.number().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },
  edit_package: (data) => {
    const validation = Joi.object().keys({
      offPrice: Joi.number().required(),
      name: Joi.string().required(),
      price: Joi.number().required(),
      credits: Joi.number().required(),
      expiration: Joi.number().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },
  register_block: (data) => {
    const validation = Joi.object().keys({
      name: Joi.string().required(),
      timeForOrder: Joi.string().required(),
      pickUpTime: Joi.string().required(),
      deliveryTime: Joi.string().required(),
      deliveryCost: Joi.number().required(),
      restaurants: Joi.array().required(),
      companies: Joi.array().required(),
      deliveryPerson: Joi.string().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },

  edit_block: (data) => {
    const validation = Joi.object().keys({
      name: Joi.string().required(),
      timeForOrder: Joi.string().required(),
      pickUpTime: Joi.string().required(),
      deliveryTime: Joi.string().required(),
      deliveryCost: Joi.number().required(),
      restaurants: Joi.array().required(),
      companies: Joi.array().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },

  edit_discount: (data) => {
    const validation = Joi.object().keys({
      leastCart: Joi.number().required(),
      referralDiscount: Joi.number().required(),
    });

    const { error, value } = validation.validate(data);
    if (error) {
      const err = new Error(error);
      err.status = error.status;
      throw err;
    }
    return value;
  },

  // update_Company: (data) => {
  //   const adress = Joi.object().keys({
  //     street: Joi.string().allow(""),
  //     location: Joi.array().allow(""),
  //     zip: Joi.string().allow(""),
  //     complement: Joi.string().allow(""),
  //     city: Joi.string().allow(""),
  //   });
  //   const proof = Joi.object().keys({
  //     KBIS: Joi.string().allow(""),
  //     identity: Joi.string().allow(""),
  //     profile: Joi.string().allow(""),
  //   });

  //   const schema = Joi.object().keys({
  //     address: adress,
  //     proofs: proof,
  //     SIRET: Joi.number().allow(""),
  //     phone: Joi.number().allow(""),
  //     timeslots: Joi.array().allow(""),
  //   });
  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const err = new Error(error);
  //     err.status = 400;
  //     throw err;
  //   }
  //   return value;
  // },
  // rating: (data) => {
  //   const schema = Joi.object().keys({
  //     byUserId: Joi.string().required(),
  //     offerId: Joi.string().required(),
  //     strength: Joi.number().required(),
  //     note: Joi.string().allow(""),
  //   });
  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const err = new Error(error);
  //     err.status = 400;
  //     throw err;
  //   }
  //   return value;
  // },
  // offer: (data) => {
  //   const schema = Joi.object().keys({
  //     start: Joi.number().required(),
  //     end: Joi.number().required(),
  //     date: Joi.date().required(),
  //     range: Joi.number().required(),
  //     company: Joi.string().required(),
  //     vehicle: Joi.array().required(),
  //     volume: Joi.string().required(),
  //     price: Joi.number().required(),
  //     requiredPerson: Joi.number().required(),
  //     rating: Joi.number().required(),
  //   });
  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const err = new Error(error.message);
  //     err.status = 400;
  //     throw err;
  //   }
  //   return value;
  // },
  // vehicleInformation: (Data) => {
  //   const vehicleData = Joi.object().keys({
  //     vehicleType: Joi.string().required(),
  //     licence: Joi.string().allow(""),
  //     purchaseProof: Joi.string().allow(""),
  //   });
  //   const data = Joi.object().keys({
  //     vehicle: vehicleData,
  //     transportType: Joi.string().required(),
  //     range: Joi.number().required(),
  //     perHour: Joi.number().required(),
  //   });
  //   const Delivery = Joi.object().keys({
  //     delivery: data,
  //     timeslots: Joi.array(),
  //     status: Joi.string(),
  //   });
  //   const { error, value } = Delivery.validate(Data);
  //   if (error) {
  //     const err = new Error(error);
  //     err.status = 400;
  //     throw err;
  //   }
  //   return value;
  // },
  // user_Info: (data) => {
  //   const adress = Joi.object().keys({
  //     street: Joi.string().required(),
  //     location: Joi.array().required(),
  //     zip: Joi.string().required(),
  //     complement: Joi.string().allow(""),
  //     city: Joi.string().required(),
  //   });

  //   const proofs = Joi.object().keys({
  //     KBIS: Joi.string().required(),
  //     identity: Joi.string().required(),
  //     profile: Joi.string().required(),
  //     diploma: Joi.string().allow(""),
  //     training: Joi.string().allow(""),
  //     insurance: Joi.string().allow(""),
  //   });

  //   const schema = Joi.object().keys({
  //     address: adress,
  //     phone: Joi.number().required(),
  //     proofs: proofs,
  //     SIRET: Joi.number().required(),
  //     status: Joi.string(),
  //   });
  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const err = new Error(error.message);
  //     err.status = 400;
  //     throw err;
  //   }
  //   return value;
  // },
  // register_User: (data) => {
  //   const schema = Joi.object().keys({
  //     firstName: Joi.string().max(30).required(),
  //     lastName: Joi.string().max(30).required(),
  //     email: Joi.string().email().required(),
  //     dob: Joi.date().required(),
  //     password: Joi.string().min(8).required(),
  //     role: Joi.string(),
  //   });
  //   const { error, value } = schema.validate(data);
  //   if (error) {
  //     const error = new Error(error);
  //     error.status = 400;
  //     throw error;
  //   }
  //   return value;
  // },
};
