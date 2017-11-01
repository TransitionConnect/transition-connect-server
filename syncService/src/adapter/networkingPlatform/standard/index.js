'use strict';

let request = require('request-promise');

let importOrganizations = function (url, lastSync, skip) {
    let options = {uri: `${url}/organization`, qs: {skip: skip, lastSync: lastSync}, json: true};
    return request(options);
};

let exportOrganizations = function (orgsToExport, url) {
    let options = {method: 'PUT', url: `${url}/organization`, json: {organizations: orgsToExport}};
    return request(options);
};

module.exports = {
    importOrganizations,
    exportOrganizations
};