import { create, test, enforce } from 'vest';

/**
 * Creates a test suite for validating user input data.
 *
 * @param {Object} data - The input data to be validated.
 */
const suite = create((data = {}) => {
    test('username', 'Username is required.', () => {
        enforce(data.username).isNotBlank()
    });
    test('username', 'Username must be at least 3 characters long.', () => {
        enforce(data.username).longerThan(2);
    })

    test('password', 'Password is required.', () => {
        enforce(data.password).isNotBlank()
    });
    test('password', 'Password must be at least 2 characters long.', () => {
        enforce(data.password).longerThan(2);
    })
    if (data.isRegister) {

        test('confirmPassword', 'Confirm password cannot be empty.', () => {
            enforce(data.confirmPassword).isNotBlank()
        })
        
        if (data.confirmPassword) {
            test('password', 'Password and Validation password must be the same.', () => {
                enforce(data.password).equals(data.confirmPassword)
            })

        }

    }


})

export default suite;
