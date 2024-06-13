const Joi = require('joi');

const emailSchema = Joi.string().email({ tlds: { allow: false } }).required().label('Email');
const passwordSchema = Joi.string().min(8).alphanum().required().label('Password');
const confirmPasswordSchema = Joi.string().required().valid(Joi.ref('password')).label('Confirm Password');

/**
 * Validate the input property
 * @param {*} param0 The input property
 * @param {*} password The password property (optional - used for confirm password validation)
 * @returns {string} Error message or "" if valid
 */
const validateProperty = ({ name, value }, password = "") => {
    let schema = null;
    if (name === 'confirmPassword') {
        schema = Joi.object({
            confirmPassword: confirmPasswordSchema,
            password: passwordSchema
        });
    } else if (name === 'password') {
        schema = Joi.object({ password: passwordSchema });
    } else if (name === 'email') {
        schema = Joi.object({ email: emailSchema });
    }


    const obj = { [name]: value };
    if (name === 'confirmPassword') obj.password = password;

    const { error } = schema.validate(obj);
    return error ? error.details[0].message : "";
}


const validateChange = (Input, setErrors, isLogin = false, password = "", confirmPassword = "") => {
    let error = null;

    if (Input.name === 'confirmPassword') {
        error = validateProperty(Input, password);
        setErrors(prevState => ({ ...prevState, confirmPassword: error }));
    } else if (Input.name === 'password') {
        error = validateProperty(Input, confirmPassword);
        setErrors(prevState => ({ ...prevState, password: error }));
    } else {
        error = validateProperty(Input);
        setErrors(prevState => ({ ...prevState, [Input.name]: error }));
    }
}

export { validateChange, validateProperty };
