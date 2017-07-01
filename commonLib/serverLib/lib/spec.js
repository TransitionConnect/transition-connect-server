'use strict';

let db = require('./databaseConfig');
let eMailQueue = require('./eMail/eMailQueue');
let eMail = require('./eMail/eMail');

module.exports = function (app) {

    let env = process.env.NODE_ENV || 'development';

    app.on('middleware:before:json', function () {
        if ('testing' !== env) {
            app.use(function (req, res, next) {
                if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].toLowerCase() === 'http') {
                    return res.redirect('https://' + req.headers.host + req.url);
                }
                next();
            });
        }
    });

    return {
        onconfig: function (config, next) {

            let dbConfig = config.get('databaseConfig'),
                emailConfig = config.get('emailConfig');

            db.config(dbConfig);
            eMailQueue.config(emailConfig);
            eMail.config(emailConfig.smtp);
            next(null, config);
        }
    };

};
