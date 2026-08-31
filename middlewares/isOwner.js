module.exports = (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'Please login first');
        return res.redirect('/');
    }
    if (req.user.admin !== true) {
        req.flash('error', 'You are not an admin');
        return res.redirect('/');
    }
    next();
};