
module.exports = () => {
    if (!process.env.JWT_PRIVATE_KEY) {
        console.error('FATAL ERROR: key(s) are not defined.');
        process.exit(1);
    }
}