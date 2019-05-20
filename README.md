# atd
Node/Javascript library for interacting with McAfee ATD appliances.

# Usage

Refer to the McAfee ATD API Guide and inside the library code.

Currently, the following API calls have been implemented:
1. Connect (login)
2. Upload (submit)
3. GetReport (showreport)
4. Close (logout).

## Connecting
```js
const atd = require('atd')(host, ssl, user, password);
atd.connect( function(err) { ... } );
```

Note: The library will automatically try and connect if you forget to call connect.

## Uploading

Submitting a file can be done with a file name off disk:
```js
atd.upload( filepath, srcip, reanalyze, function(err, meta) { ... } );
```

Or via a stream:
```js
atd.upload( filename, srcip, reanalyze, function(err, meta) { ... }, stream );
```

On success, meta is a structure like:
```js
{
    success: true,
    jobId: 397,
    md5: 'FD4C32A8412EED390BD66D0152EE1650',
    sha1: 'AFB23D7DBACD53B0A0564DAF259048EB9ACE8F14',
    sha256: '01534F5786529E78A0018A7D48ED385E6F20736523AB014BA505E91DD0FA0001'
}
```

## Get Report

Get the report for a the given JobId, TaskId or md5 hash:
```js
atd.getReport( atd.LOOKUP.???, searchValue, atd.REPORT.???, function(err, report) { ... } );
```

Where the LOOKUP and REPORT options are:

```js
atd.REPORT = {
    HTML:   '...',
    TXT:    '...',
    XML:    '...',
    ZIP:    '...',
    JSON:   '...',
    IOC:    '...',
    STIX:   '...',
    PDF:    '...',
    SAMPLE: '...'
};

atd.LOOKUP = {
    JOBID:  '...',
    TASKID: '...',
    MD5:    '...'
    // todo: any others?
};
```

The type of the report callback parameter will be determined by the atd.REPORT type requested.

In the case of atd.REPORT.JSON, it will already be parsed, in all other cases it will be the raw response and needs to be decoded/saved/etc according to that format.

## Clean Up
```sh
atd.close( function(err) { ... } );
```

# Testing

To test the library, first copy "test/params-default.js" to "test/params.js" and enter valid ATD host IP and credentials. Then:
```sh
npm run test
```

# license
MIT

# thanks
largely ported from https://github.com/passimens/atdlib