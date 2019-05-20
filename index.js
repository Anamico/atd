'use strict';

const request = require('request');
const fs = require('fs');

/**
 * Create a new ATD connection object
 * @param {string} host
 * @param {string} username
 * @param {string} password
 * @return {Object} atd
 */

module.exports = function(host, ssl, username, password) {

    const baseUrl = 'https://' + host + '/php/';

    const _header = {
        'Accept': 'application/vnd.ve.v1.0+json',
        'VE-API-Version': '1.5.0',
        'user-agent': 'Javascript ATD Client',
        'Content-Type': 'application/json'
    };

    const userpass = new Buffer(username + ':' + password);
    const userpass_enc = userpass.toString('base64');

    /**
     * parseResponse
     * 
     * @param {*} error 
     * @param {*} response 
     * @param {*} body 
     * @param {*} callback (err)
     * @returns parsed response, or null if error and callback called
     */
    function parseResponse(error, response, body, callback) {
        //console.log('parse** ', error, response, body);
        if (error) {
            callback(error);
            return null;
        }

        var info = null;
        try {
            info = JSON.parse(body);
        } catch (e) {
            // NOP
        }

        if (response.statusCode != 200) {
            callback(new Error(info && info.errorMessage ?
                response.statusCode + ":" + info.errorMessage :
                'HTTP Code: ' + response.statusCode));
            return null;
        }
        
        
        if (!info.success) {
            callback(new Error(info.errorMessage || 'Unknown Error'));
            return null;
        }

        return info;
    }

    /**
     * try and "log in"
     * 
     * @param {*} callback (err, results from atd)
     */
    function createSession(callback) {
        // set the header with Auth
        const headers = Object.assign({}, _header, {
            'VE-SDK-API': userpass_enc
        });

        // get a session ID
        const url = baseUrl + "session.php";

        console.log('connect', url, headers);

        request({
            method: 'GET',
            uri: url,
            headers: headers,
            timeout: 2000,
            rejectUnauthorized: false       // todo: make this default true and override
        }, function(error, response, body) {
            const info = parseResponse(error, response, body, callback);
            if (!info) { return; }
            console.log(info);

            callback(null, info.results);
        });
    }

    var atd = {
        host: host
    };

    /**
     * try and "log in"
     * 
     * @param {*} callback (err)
     */
    atd.connect = function(callback) {
        createSession(function(err, results) {
            atd.session = results && results.session;
            atd.userId = results && results.userId;
            atd.isAdmin = results && results.isAdmin;
            atd.serverTZ = results && results.serverTZ;
            atd.apiVersion = results && results.apiVersion;
            atd.matdVersion = results && results.matdVersion;
            const auth = atd.session && atd.userId && new Buffer(atd.session + ':' + atd.userId);
            atd.auth = auth && auth.toString('base64');
            callback(err);
        });
    }

    /**
     * close any open session (log out)
     * 
     * @param {*} callback (err)
     */
    atd.close = function(callback) {
        if (!atd.session) {
            return callback(null, true);
        }

        const headers = Object.assign({}, _header, {
            'VE-SDK-API': userpass_enc
        });

        const url = baseUrl + '/session.php'

        request({
            method: 'DELETE',
            uri: url,
            headers: headers,
            timeout: 2000,
            rejectUnauthorized: false       // todo: make this default true and override
        }, function(error, response, body) {
            const info = parseResponse(error, response, body, callback);
            if (!info) { return }
            console.log(info);

            atd.auth = null;
            atd.session = null;
            atd.userId = null;
            atd.isAdmin = null;
            atd.serverTZ = null;
            atd.apiVersion = null;
            atd.matdVersion = null;

            callback(null, info.results);
        });
    }

    /**
     * Uploads file to ATD for analysis.
	 * filename - absolute or relative path to the file being analyzed,
	 * srcip - string representing source IP address for reporting purposes.
	 * reanalyze - boolean, whether to forcibly reanalyze previously submitted sample.
     * callback(error, jobId) - for completion, returns analysis job id
     * stream - IF SUPPLIED, then this is the stream for file content.
     * 
     */
    atd.upload = function(filename, srcip, reanalyze, callback, stream, suppressAutoconnect) {
        // ensure connected (session)
        if (!atd.session || !atd.auth) {
            if (suppressAutoconnect) {
                return callback(new Error('Invalid Session'));
            }
            atd.connect(function(err) {
                return atd.upload(filename, srcip, reanalyze, callback, stream, true);
            });
        }


        // url = baseUrl + 'atdHashLookup.php';
        const uploadUrl = baseUrl + 'fileupload.php';

        const headers = Object.assign({}, _header, {
            'VE-SDK-API': atd.auth,
            "Content-Type": "multipart/form-data"
        });

        const data = {
            submitType: 0, // regular file upload
            srcIp: srcip,
            // destIp: '1.2.3.4',
            analyzeAgain: reanalyze === true ? '1' : '0'
        };

        // pipe the supplied stream or fall back to the file from the local file system
        const formData = {
            amas_filename: stream || fs.createReadStream(filename),
            data: JSON.stringify({ data: data})
        };
        
        var options = {
            method: 'POST',
            uri: uploadUrl,
            headers: headers,
            timeout: 2000,
            formData: formData,
            //data: JSON.stringify(data),
            rejectUnauthorized: false       // todo: make this default true and override
        }

        console.log('submit to ATD', options);

        request(options, function(error, response, body) {
            // todo: auto reconnect if session is no longer valid?
            const info = parseResponse(error, response, body, callback);
            if (!info) { return }
            console.log(info);

            const fileData = info.results && info.results[0];
            const meta = {
                success: info.success,
                jobId: info.subId,
                md5: fileData && fileData.md5,
                sha1: fileData && fileData.sha1,
                sha256: fileData && fileData.sha256
            }
            return callback(error, meta);
        });
    }

    /**
     * ATD report types.
     */
    atd.REPORT = {
        HTML: 'html',
        TXT: 'txt',
        XML: 'xml',
        ZIP: 'zip',
        JSON: 'json',
        IOC: 'ioc',
        STIX: 'stix',
        PDF: 'pdf',
        SAMPLE: 'sample'
    };

    /**
     * ATD report lookup options.
     */
    const lookupKeys = {
        JOBID: 'jobId',
        TASKID: 'iTaskId',
        MD5: 'md5'
        // todo: any others?
    };
    atd.LOOKUP = lookupKeys;

    /**
     * Uploads file to ATD for analysis.
	 * filename - absolute or relative path to the file being analyzed,
	 * srcip - string representing source IP address for reporting purposes.
	 * reanalyze - boolean, whether to forcibly reanalyze previously submitted sample.
     * callback(error, jobId) - for completion, returns analysis job id
     * stream - IF SUPPLIED, then this is the stream for file content.
     * 
     */
    atd.getReport = function(lookupOption, lookupValue, type, callback, suppressAutoconnect) {
        // ensure connected (session)
        if (!atd.session || !atd.auth) {
            if (suppressAutoconnect) {
                return callback(new Error('Invalid Session'));
            }
            atd.connect(function(err) {
                return atd.getReport(lookupOption, lookupValue, type, callback, true);
            });
        }

        const validOptions = Object.values(lookupKeys);
        if (validOptions.indexOf(lookupOption) < 0) {
            return callback(new Error('Invalid Report Lookup Option: ' + Object.keys(lookupKeys).join(', ')));
        }

        const reportUrl = baseUrl + 'showreport.php';

        const headers = Object.assign({}, _header, {
            'VE-SDK-API': atd.auth
            // should be "Expert"? : "Content-Type": "multipart/form-data"
        });
        delete headers['Content-Type'];
        
        var options = {
            method: 'GET',
            uri: reportUrl,
            headers: headers,
            timeout: 2000,
            qs: {
                iType: type,
                [lookupOption]: lookupValue
            },
            rejectUnauthorized: false       // todo: make this default true and override
        }

        console.log('show report', options);

        request(options, function(error, response, body) {
            // todo: auto reconnect if session is no longer valid?
            console.log(error, response, body);
            if (error) {
                return callback(error);
            }
    
            var info = null;
            if (type === atd.REPORT.JSON) {
                try {
                    info = JSON.parse(body);
                } catch (e) {
                    // NOP
                }
            }
    
            if (response.statusCode != 200) {
                return callback(new Error(info && info.errorMessage ?
                    response.statusCode + ":" + info.errorMessage :
                    'HTTP Code: ' + response.statusCode));
            }

            return callback(error, !error && body);
        });
    }

    return atd;
};
