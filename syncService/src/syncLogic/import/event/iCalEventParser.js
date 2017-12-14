'use strict';

let moment = require('moment');
let iCalProperties = require('./iCalProperties');
let iCalDateParser = require('ical-date-parser');
let logger = require('server-lib').logging.getLogger(__filename);

const BEGIN_EVENT = 'BEGIN:VEVENT';
const END_EVENT = 'END:VEVENT';

const UID = 'UID:';
const SUMMARY = 'SUMMARY:';
const DESCRIPTION = 'DESCRIPTION:';
const LOCATION = 'LOCATION:';
const GEO = 'GEO:';
const START_DATE_EVENT = 'DTSTART';
const END_DATE_EVENT = 'DTEND';
const START_DATE_VALUE_EVENT = 'DTSTART;VALUE=DATE';
const END_DATE_VALUE_EVENT = 'DTEND;VALUE=DATE';

let parseString = function (vEvent, property, isMandatory) {
    let index = vEvent.indexOf(property), result = null;
    if (index !== -1) {
        let indexSeparator = vEvent.indexOf(':', index) + 1;
        result = vEvent.substring(indexSeparator, vEvent.indexOf('\n', index));
        result = result.replace('\r', '');
        result = result.replace('\n', '');
    } else if (isMandatory) {
        logger.error(`${property} in ${vEvent} not found`);
    }
    return result;
};

let multiIncludes = function (text, values) {
    let regExp = new RegExp(values.join('|'));
    return regExp.test(text);
};

let parseDescription = function (vEvent) {
    let index = vEvent.indexOf(DESCRIPTION), description = null;
    if (index !== -1) {
        let indexSeparator = vEvent.indexOf(':', index) + 1;
        let lines = vEvent.substring(indexSeparator).split('\n');
        description = [lines[0]];
        lines.shift();
        for (let line of lines) {
            if (multiIncludes(line, iCalProperties) || multiIncludes(line, ['VEVENT'])) {
                break;
            } else {
                description.push(line);
            }
        }
        description = description.join('\n');
    }
    return description;
};

let parseGeo = function (vEvent, uid) {
    let index = vEvent.indexOf(GEO), geo = null;
    if (index !== -1) {
        let indexSeparator = vEvent.indexOf(':', index) + 1;
        let lastIndexLine = vEvent.indexOf('\n', index);
        let geoCoordinates = vEvent.substring(indexSeparator, lastIndexLine).split(';');
        if (geoCoordinates.length === 2) {
            geo = {
                latitude: parseFloat(geoCoordinates[0]),
                longitude: parseFloat(geoCoordinates[1])
            };
        } else {
            logger.error(`Wrong geo coordinates ${geoCoordinates.join(';')} for event ${uid}`);
        }
    }
    return geo;
};

let parseDate = function (vEvent, property, valueProperty, isMandatory) {
    let result = parseString(vEvent, valueProperty, false);
    if (result === null) {
        result = parseString(vEvent, property, isMandatory);
    } else {
        result = result + 'T000000Z';
    }
    result = result.replace('\r', '');
    return moment.utc(iCalDateParser(result)).valueOf() / 1000;
};

/**
 * Remove DTSTAMP for check if event has been changed because this field changes on every import.
 * @param iCal
 * @returns {*}
 */
let getICalCompare = function (iCal) {
    let startIndex = iCal.indexOf('DTSTAMP');
    let endIndex = iCal.indexOf('\n', startIndex);
    if (startIndex !== -1 && endIndex !== -1) {
        return iCal.substring(0, startIndex) + iCal.substring(endIndex + 1);
    }
    return iCal;
};

let parseEvent = function (vEvent) {
    let event = {};
    event.uid = parseString(vEvent, UID, true);
    event.summary = parseString(vEvent, SUMMARY, true);
    event.description = parseDescription(vEvent);
    event.location = parseString(vEvent, LOCATION, false);
    event.geo = parseGeo(vEvent, event.uid);
    event.startDate = parseDate(vEvent, START_DATE_EVENT, START_DATE_VALUE_EVENT, true);
    event.endDate = parseDate(vEvent, END_DATE_EVENT, END_DATE_VALUE_EVENT, true);
    event.iCal = vEvent;
    event.iCalCompare = getICalCompare(vEvent);
    return event;
};

let parseEvents = function (iCal) {
    let events = [], startIndex = 0, endIndex = 0;
    do {
        startIndex = iCal.indexOf(BEGIN_EVENT, startIndex);
        endIndex = iCal.indexOf(END_EVENT, endIndex);
        if (startIndex !== -1 && endIndex !== -1) {
            endIndex = endIndex + END_EVENT.length;
            events.push(parseEvent(iCal.substring(startIndex, endIndex)));
            startIndex = endIndex;
        }
    }
    while (startIndex !== -1 && endIndex !== -1);
    return events;
};

module.exports = {
    parseEvents
};
