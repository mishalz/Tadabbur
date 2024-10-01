const validateInput = (data, schema) => {
  const { error, value } = schema.validate(data); //if the schema is valid, the error will be undefined, otherwise the error will have the Joi ValidationError object.

  if (error) {
    //incase of error, send back an appropriate error response
    return { success: false, status: 422, message: error.details[0].message };
  } else if (value) return { success: true, status: 200, data: value }; //if there is no error, return the validated data
};

module.exports = { validateInput };
