'use strict';

let db = require('server-lib').neo4j;
let security = require('./secuity');

let getOrganizationCommand = function (organizationId) {
    return db.cypher().match(`(org:Organization {organizationId: {organizationId}})`)
        .optionalMatch(`(org)<-[:IS_ADMIN]-(admin:Admin)`)
        .with(`org, admin`)
        .orderBy(`admin.email`)
        .return(`org.name AS name, COLLECT(admin.email) AS administrators`)
        .end({organizationId: organizationId}).getCommand();
};

let getConfig = function (adminId, organizationId, language, req) {

    return security.checkAllowedToAccessConfig(adminId, organizationId, req).then(function () {
        let commands = [];
        commands.push(getOrganizationCommand(organizationId));

        return db.cypher().match(`(np:NetworkingPlatform)`)
            .where(`NOT (np)-[:CREATED]->(:Organization {organizationId: {organizationId}})`)
            .with(`np`)
            .match(`(np)-[:CATEGORY]->(:SimilarCategoryMapper)-[:USED_CATEGORY]->
                    (category:Category)-[categoryLanguage]->(categoryTranslated:CategoryTranslated)`)
            .where(`TYPE(categoryLanguage) = {language}`)
            .optionalMatch(`(:Organization {organizationId: {organizationId}})-[:ASSIGNED]->(assigner:CategoryAssigner)
                             -[:ASSIGNED]->(np:NetworkingPlatform)`)
            .with(`np, assigner, category, categoryTranslated`)
            .orderBy(`categoryTranslated.name`)
            .match(`(org:Organization {organizationId: {organizationId}})`)
            .return(`np.name AS name, np.description AS description, np.link AS link, np.platformId AS platformId, 
                     EXISTS((org)-[:EXPORT|:EXPORT_REQUEST|:EXPORT_DENIED]->(np)) AS isExported,
                     EXISTS((org)-[:EXPORT_DENIED]->(np)) AS isDenied,
                     COLLECT({name: categoryTranslated.name, categoryId: category.categoryId, 
                     isSelected: EXISTS((assigner)-[:ASSIGNED]->(category))}) AS categories`)
            .orderBy(`isExported DESC, name`)
            .end({adminId: adminId, organizationId: organizationId, language: language})
            .send(commands).then(function (resp) {
                return {organization: resp[0][0], networkingPlatforms: resp[1]};
            });
    });
};

module.exports = {
    getConfig
};