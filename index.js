'use strict';

const request = require('request');

/**
 * Create a new ATD connection object
 * @param {string} host
 * @param {string} username
 * @param {string} password
 * @return {Object} atd
 */

module.exports = function(host, username, password) {

    const baseUrl = 'https://' + host + '/php/';

    function createSession(callback) {
        // set the header with Auth
        const userpass = new Buffer(username + ':' + password);
        const userpass_enc = userpass.toString('base64');
        const headers = {
            'Accept': 'application/vnd.ve.v1.0+json',
            'Content-Type': 'application/json',
            'VE-SDK-API': userpass_enc
        };

        // get a session ID
        const url = baseUrl + "session.php";

        //console.log('connect', url, headers);

        request({  // verify: false?
            method: 'GET',
            uri: url,
            headers: headers,
            rejectUnauthorized: false
        }, function(error, response, body) {
            //console.log(error, response, body);
            if (error) {
                return callback(error);
            }

            var info = null;
            try {
                info = JSON.parse(body);
            } catch (e) {
                // NOP
            }

            if (response.statusCode != 200) {
                return callback(error || new Error(info && info.errorMessage ? response.statusCode + ":" + info.errorMessage : 'HTTP Code: ' + response.statusCode));
            }
            
            
            if (!info.success) {
                return callback(new Error(info.errorMessage || 'Unknown Error'));
            }

            console.log(info);
            callback(null, info.results);
        });
    }

    var atd = {
        host: host
    };

    atd.connect = function(callback) {
        createSession(function(err, results) {
            atd.session = results && results.session;
            atd.userId = results && results.userId,
            atd.isAdmin = results && results.isAdmin,
            atd.serverTZ = results && results.serverTZ,
            atd.apiVersion = results && results.apiVersion,
            atd.matdVersion = results && results.matdVersion;
            callback(err);
        });
    }

    atd.upload = function(filename, stream) {
        // url = baseUrl + 'atdHashLookup.php';
        const uploadUrl = baseUrl + 'fileupload.php';

        if (stream) {
            return stream.pipe(request.post(uploadUrl));
        }

        // otherwise just post the filename as a full path from the local file system
        fs.createReadStream('file.json').pipe(request.post(uploadUrl));
    }

    return atd;
};
