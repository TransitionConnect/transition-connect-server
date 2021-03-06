'use strict';

let passport = require('passport');
let logger = require('server-lib').logging.getLogger(__filename);
let rateLimit = require('server-lib').limiteRate;
let admin = requireLib('admin');

let apiLimiter = rateLimit.getRate({
    windowMs: 10 * 60 * 1000, // 10 minutes
    delayAfter: 3,
    delayMs: 3 * 1000,
    max: 50
});

module.exports = function (router) {

    router.post('/', apiLimiter, function (req, res) {
        passport.authenticate('local', function (err, user) {

            if (err) {
                logger.error('Authentication of user failed', req, {error: err});
                return res.status(500).end();
            }
            if (!user) {
                logger.warn('User not allowed to login', req, {httpStatusCode: 400});
                return res.status(400).end();
            }

            req.logIn(user, async function (errLogin) {
                if (errLogin) {
                    logger.error('Login of user failed', req, {error: errLogin});
                    return res.status(500).end();
                }
                await admin.invalidatePasswordOfUser(user.id);
                res.status(200).end();

            });
        })(req, res);
    });
};
