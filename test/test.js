'use strict';

const params = require('./params');
var expect = require('chai').expect;
var atd = require('../index')(params.host, params.ssl, params.user, params.password);
var meta = {};

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
            atd.upload(__dirname + '/testFile.exe', '1.2.3.4', true, function(err, result) {
                //assert no error
                if (err) {
                    return reject(err);
                }
    
                meta = result;
                console.log('meta: ', meta);

                resolve();
            });
        });
    });

    // it('should return a task list', function() {
    //     return new Promise(function (resolve, reject) {
    //         atd.getTaskIdList(384 /*meta.jobId*/, function(err, taskIdList) {
    //             //assert no error
    //             if (err) {
    //                 return reject(err);
    //             }
    
    //             console.log('taskIdList: ', taskIdList);
    //             resolve();
    //         });
    //     });
    // });

    // it('should return a status', function() {
    //     return new Promise(function (resolve, reject) {
    //         atd.getBulkStatus(384 /*meta.jobId*/, function(err, taskIdList) {
    //             //assert no error
    //             if (err) {
    //                 return reject(err);
    //             }
    
    //             console.log('taskIdList: ', taskIdList);
    //             resolve();
    //         });
    //     });
    // });

    // it('should return a status', function() {
    //     return new Promise(function (resolve, reject) {
    //         atd.getBulkStatus(384 /*meta.jobId*/, function(err, taskIdList) {
    //             //assert no error
    //             if (err) {
    //                 return reject(err);
    //             }
    
    //             console.log('taskIdList: ', taskIdList);
    //             resolve();
    //         });
    //     });
    // });

    it('should return a report', function() {
        return new Promise(function (resolve, reject) {
            atd.getReport(atd.LOOKUP.JOBID, meta.jobId, atd.REPORT.JSON, function(err, report) {
                //assert no error
                if (err) {
                    return reject(err);
                }
    
                console.log('report: ', report);
                resolve();
            });
        });
    });

    it('should log out', function() {
        return new Promise(function (resolve, reject) {
            atd.close(function(err) {
                //assert no error
                if (err) {
                    //if (err.)
                    return reject(err);
                }
    
                console.log('logged out');
                resolve();
            });
        });
    });
});
