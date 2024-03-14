// Used to check if the user is an admin.
// Needed for operations alike: retrieving ALL sponsors, deleting a sponsor, etc.
module.exports = function (req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).send('Access denied.');
    }
    next();
}