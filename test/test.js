'use strict';

const params = require('./params');
var expect = require('chai').expect;
var atd = require('../index')(params.host, params.user, params.password);

describe('#atd', function() {
    it('should create a session', async function(done) {
        console.log(atd);
        atd.connect(function(err, session) {
            if (err) {
                return done(err);
            }
            console.log(atd.session);
            done();
        });
    });
});
