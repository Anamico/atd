'use strict';

const params = require('./params');
var expect = require('chai').expect;
var atd = require('../index')(params.host, params.ssl, params.user, params.password);

// todo: write standalone tests where we can
// todo: move live upload tests to an example folder
describe('#atd', function() {
    it('should create a session', function() {
        //console.log(atd);
        return new Promise(function (resolve, reject) {
            atd.connect(function(err, session) {
                //assert no error
                if (err) {
                    return reject(err);
                }
    
                console.log('session: ', atd.session);
                resolve();
            });
        });
    });

    it('should upload a file from disk', function() {
        return new Promise(function (resolve, reject) {
            atd.upload(__dirname + '/testFile.exe', '1.2.3.4', true, function(err, jobId) {
                //assert no error
                if (err) {
                    return reject(err);
                }
    
                console.log('jobId: ', jobId);
                resolve();
            });
        });
    });
});
