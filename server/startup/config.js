
module.exports = () => {
    if (!process.env.jwtPrivateKey) {
        console.error('FATAL ERROR: key(s) are not defined.');
        process.exit(1);
    }
}