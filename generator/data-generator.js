'use strict';

const EventEmitter = require('events');
var BlueBird = require('bluebird');
const fs = require('fs');
const path = require('path');
const os = require('os');
const utils = require('../utils/utils');

class DataGenerator extends EventEmitter {
    constructor() {
        super();
        this.data = {};
    }

    createDefaultFolder(channel) {
        let d = new Date();

        let m = (d.getUTCMonth() + 1).toString();
        let a = d.getUTCDate().toString();

        this.data.datepart = {};
        this.data.datepart.month = m.length === 1 ? '0' + m : m;
        this.data.datepart.day = a.length === 1 ? '0' + a : a;
        this.data.datepart.year = d
            .getFullYear()
            .toString()
            .substring(2, 4);
        this.data.defaultDate = true;

        let folderName =
            channel + '_' + this.data.datepart.year + '_' + this.data.datepart.month + '_' + this.data.datepart.day;

        let targetfolder = path.join(process.env.TARGET_FOLDER, folderName);

        this.data.fullpath = targetfolder;

        fs.existsSync(targetfolder) || fs.mkdirSync(targetfolder);

        return folderName;
    }

    createCustomFolder(channel, cfolder) {
        this.data.datepart = {};
        this.data.datepart.month = cfolder.substring(3, 5);
        this.data.datepart.day = cfolder.substring(6, 9);
        this.data.datepart.year = cfolder.substring(0, 2);
        this.data.defaultDate = false;
        let folderName =
            channel + '_' + this.data.datepart.year + '_' + this.data.datepart.month + '_' + this.data.datepart.day;

        let targetfolder = path.join(process.env.TARGET_FOLDER, folderName);

        this.data.fullpath = targetfolder;

        fs.existsSync(targetfolder) || fs.mkdirSync(targetfolder);

        return folderName;
    }

    initFolder() {
        this.data.files = {};
        this.data.files.dataFile = path.join(this.data.fullpath, this.data.targetfolder + '.txt');
        this.data.files.indexFile = path.join(this.data.fullpath, this.data.targetfolder + '.idx');

        if (!fs.existsSync(this.data.files.dataFile)) {
            fs.writeFileSync(this.data.files.dataFile, '');
        }
        if (!fs.existsSync(this.data.files.indexFile)) {
            fs.writeFileSync(this.data.files.indexFile, '');
        }

        return;
    }

    buildDataFile() {
        var promise = new BlueBird((resolve, reject) => {
            this.data.source.datafilepath = path.join(process.env.SOURCE_FOLDER, this.data.sourceid.toString());
            this.data.source.datafilename = path.join(this.data.source.datafilepath, 'data.txt');
            this.data.source.data = {};

            if (fs.existsSync(this.data.source.datafilename)) {
                fs.readFileSync(this.data.source.datafilename, 'utf-8')
                    .split('\n')
                    .filter(Boolean)
                    .forEach(c => {
                        if (c === '' || c === 'undefined') {
                            reject(false);
                        }

                        let sData = c.split(' ');
                        let lineData = [];

                        sData.forEach(ld => {
                            if (ld !== '') lineData.push(ld);
                        });

                        let curDate = utils.getDate();

                        let cDate = new Date(
                            parseInt('20' + this.data.datepart.year),
                            parseInt(this.data.datepart.month) - 1,
                            parseInt(this.data.datepart.day),
                            curDate.getUTCHours(),
                            curDate.getUTCMinutes(),
                            curDate.getUTCSeconds()
                        );

                        let offset = -cDate.getTimezoneOffset();

                        cDate = new Date(cDate.getTime() + offset * 60 * 1000);

                        let cdateStr = this.data.defaultDate ?
                            curDate
                            .toISOString()
                            .replace(/T/, '')
                            .replace(/\..+/, '')
                            .split('-')
                            .join('')
                            .split(':')
                            .join('') :
                            cDate
                            .toISOString()
                            .replace(/T/, '')
                            .replace(/\..+/, '')
                            .split('-')
                            .join('')
                            .split(':')
                            .join('');

                        this.data.source.data = {
                            dateStr: cdateStr,
                            plate: lineData[2],
                            vopt1: lineData[3],
                            vopt2: lineData[4],
                        };
                    });

                resolve();
            } else {
                reject('Source Not Found');
            }
        });

        return promise;
    }

    getMaxCurrentIndex() {
        var promise = new BlueBird((resolve, reject) => {
            if (fs.existsSync(this.data.files.indexFile)) {
                this.data.source.currentMaxIndex = 0;

                fs.readFileSync(this.data.files.indexFile, 'utf-8')
                    .split('\n')
                    .filter(Boolean)
                    .forEach(c => {

                        let sData = c.split(' ');
                        let sId = parseInt(sData[0])

                        if (sId > this.data.source.currentMaxIndex) {
                            this.data.source.currentMaxIndexStr = sData[0];
                            this.data.source.currentMaxIndex = sId;
                        }
                    });

                this.data.source.currentMaxIndex = this.data.source.currentMaxIndex === 0 ? this.data.source.currentMaxIndex : this.data.source.currentMaxIndex + 1
                resolve();
            } else {
                reject('Source Not Found');
            }
        });

        return promise;
    }


    copyImageFiles() {
        var promise = new BlueBird((resolve, reject) => {

            this.data.source.indexRawData.forEach((raw) => {
                let sImgFile = path.join(this.data.source.datafilepath, raw.imgFile);
                let tImgFile = path.join(this.data.fullpath, raw.rowId + '.jpg');

                fs.copyFileSync(sImgFile, tImgFile)
            })
            resolve()
        });

        return promise;
    }

    copyAviFile() {
        var promise = new BlueBird((resolve, reject) => {

            let sAviFile = path.join(this.data.source.datafilepath, 'data.avi');
            let tAviFile = path.join(this.data.fullpath, this.data.source.data.idx + '.avi');
            fs.copyFile(sAviFile, tAviFile, errCopy => {
                if (errCopy) {
                    reject('Copy Avi File Error', errCopy);
                } else {
                    this.data.files.avifile = tAviFile;
                    resolve();
                }
            });
        });

        return promise;
    }

    updateIndexFile() {
        var promise = new BlueBird((resolve, reject) => {
            if (fs.existsSync(this.data.files.indexFile)) {
                let idCounter = this.data.source.currentMaxIndex;

                this.data.source.indexRawData.forEach(row => {
                    let rowIdVal = idCounter + row.detailIndex;
                    let ccStr = rowIdVal.toString();
                    row.rowId =
                        ccStr.length === 1 ?
                        '000000' + ccStr :
                        ccStr.length === 2 ?
                        '00000' + ccStr :
                        ccStr.length === 3 ?
                        '0000' + ccStr :
                        ccStr.length === 4 ?
                        '000' + ccStr :
                        ccStr.length === 5 ?
                        '00' + ccStr :
                        ccStr;

                    row.rowTxt =
                        row.rowId +
                        ' ' +
                        row.dataIdx +
                        ' ' +
                        row.params0 +
                        ' ' +
                        row.params1 +
                        ' ' +
                        row.params2 +
                        ' ' +
                        row.params3 +
                        ' ' +
                        row.params4 +
                        ' ' +
                        row.params5;
                });

                var stream = fs.createWriteStream(this.data.files.indexFile, {
                    flags: 'a'
                });

                this.data.source.indexRawData.forEach(row => {
                    stream.write(row.rowTxt + "\n");
                })

                stream.end();

                resolve();
            } else {
                reject('Target Data File Not Exist', this.data.files.dataFile);
            }
        });

        return promise;
    }



    appendDataFile() {
        var promise = new BlueBird((resolve, reject) => {
            if (fs.existsSync(this.data.files.dataFile)) {
                let cc = fs
                    .readFileSync(this.data.files.dataFile, 'utf-8')
                    .split('\n')
                    .filter(Boolean).length;

                let ccStr = (cc).toString();
                let idStr =
                    ccStr.length === 1 ?
                    '00000' + ccStr :
                    ccStr.length === 2 ?
                    '0000' + ccStr :
                    ccStr.length === 3 ?
                    '000' + ccStr :
                    ccStr.length === 4 ?
                    '00' + ccStr :
                    ccStr.length === 5 ?
                    '0' + ccStr :
                    ccStr;

                this.data.source.data.idx = idStr;

                idStr = cc === 0 ? idStr : os.EOL + idStr;

                let row =
                    idStr +
                    ' ' +
                    this.data.source.data.dateStr +
                    ' ' +
                    this.data.source.data.plate +
                    '      ' +
                    this.data.source.data.vopt1 +
                    ' ' +
                    this.data.source.data.vopt2;

                fs.appendFile(this.data.files.dataFile, row, 'utf-8', err => {
                    if (err) {
                        reject('Append Data File Error', err);
                    } else {
                        resolve();
                    }
                });
            } else {
                reject('Target Data File Not Exist', this.data.files.dataFile);
            }
        });

        return promise;
    }

    Add(body) {
        var promise = new BlueBird((resolve, reject) => {
            let _channel = body.channel === undefined ? '00101' : body.channel;
            let targetdir =
                body.td === undefined ? this.createDefaultFolder(_channel) : this.createCustomFolder(_channel, body.td);

            this.data.sourceid = body.sourceid === undefined ? 1 : body.sourceid;
            this.data.targetfolder = targetdir;
            this.data.channel = _channel;

            this.initFolder();

            this.data.source = {};

            this.buildDataFile()
                .then(() => {
                    this.appendDataFile()
                        .then(() => {
                            this.buildIndexFile()
                                .then(() => {
                                    this.getMaxCurrentIndex()
                                        .then(() => {
                                            this.updateIndexFile()
                                                .then(() => {
                                                    this.copyImageFiles()
                                                        .then(() => {
                                                            this.copyAviFile()
                                                                .then(() => {
                                                                    console.log(this.data);
                                                                    resolve(this.data);
                                                                })
                                                                .catch(errCopyAvi => {
                                                                    reject(errCopyAvi);
                                                                });
                                                        })
                                                        .catch(errCopyImageFiles => {
                                                            reject(errCopyImageFiles);
                                                        });
                                                })
                                                .catch(errUpdateIndexFile => {
                                                    reject(errUpdateIndexFile);
                                                });
                                        })
                                        .catch(errMaxCurrentIndex => {
                                            reject(errMaxCurrentIndex);
                                        });
                                })
                                .catch(errBuildIndex => {
                                    reject(errBuildIndex);
                                });
                        })
                        .catch(errAppend => {
                            reject(errAppend);
                        });
                })
                .catch(err => {
                    reject(err);
                });
        });

        return promise;
    }

    buildIndexFile() {
        var promise = new BlueBird((resolve, reject) => {
            this.data.source.indexfilepath = path.join(process.env.SOURCE_FOLDER, this.data.sourceid.toString());
            this.data.source.indexfilename = path.join(this.data.source.datafilepath, 'data-index.idx');
            this.data.source.indexRawData = [];

            let idxx = 0;

            if (fs.existsSync(this.data.source.indexfilename)) {
                fs.readFileSync(this.data.source.indexfilename, 'utf-8')
                    .split('\n')
                    .filter(Boolean)
                    .forEach(c => {
                        if (c === '' || c === 'undefined') {
                            reject(false);
                        }

                        let sData = c.split(' ');

                        let lineData = [];

                        sData.forEach(ld => {
                            if (ld !== '') lineData.push(ld);
                        });

                        let iData = {
                            detailIndex: idxx,
                            dataIdx: this.data.source.data.idx,
                            params0: lineData[2],
                            params1: lineData[3],
                            params2: lineData[4],
                            params3: lineData[5],
                            params4: lineData[6],
                            params5: lineData[7],
                            imgFile: idxx + '.jpg',
                        };

                        this.data.source.indexRawData.push(iData);

                        idxx++;
                    });

                resolve();
            } else {
                reject('Source Not Found');
            }
        });

        return promise;
    }
}

module.exports = DataGenerator;