const joi = require('joi');

export const LoginSchema = joi.object({
    email: joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required()
    .error(
        (errors) => {
            errors.forEach(err => {
                switch (err.code) {
                    case 'string.empty':
                        err.message = 'Email is required';
                        break;
                    case 'string.email':
                        err.message = 'Email is invalid';
                        break;
                    default:
                        break;
                }
            });
            return errors;
        }
    ),
    password: 
        joi.string()
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .min(8)
        .max(30)
        .error(
            (errors) => {
                errors.forEach(err => {
                    switch (err.code) {
                        case 'string.empty':
                            err.message = 'Password must be at least 8 characters long and contain at least one number';
                            break;
                        case 'string.pattern.base':
                            err.message = 'Password must be at least 8 characters long and contain at least one number';
                            break;
                        case 'string.min':
                            err.message = 'Password must be at least 8 characters long and contain at least one number';
                            break;
                        case 'string.max':
                            err.message = 'Password must be at least 8 characters long and contain at least one number';
                            break;
                        default:
                            break;
                    }
                });
                return errors;
            }
        )
});