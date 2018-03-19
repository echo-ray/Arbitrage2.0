/**
 * UploadController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    // index: function (req, res) {
    //     var fileNames = [];
    //     req.file("file").upload({
    //         // ...any other options here... 
    //         // adapter: require('skipper-gclouds'),
    //         projectId: 'wohligerp',
    //         keyFilename: 'keyFile.json',
    //         bucket: 'wohlig',
    //         public: true,
    //     }, function (err, data) {
    //         res.callback(err, _.map(data, function (n) {
    //             return n.fd;
    //         }));
    //     });
    // },
    index: function (req, res) {
        var fileNames = [];
        req.file("file").upload({
            maxBytes: 10485760 // 10 MB Storage 1 MB = 10^6
        }, function (err, uploadedFile) {
            //console.log(err);
            //console.log(uploadedFile);
            if (err) {
                res.callback(err);
            } else if (uploadedFile && uploadedFile.length > 0) {
                async.concat(uploadedFile, function (n, callback) {
                    Config.uploadFile(n.fd, function (err, value) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, value.name);
                        }
                    });
                }, res.callback);
            } else {
                res.callback(null, {
                    value: false,
                    data: "No files selected"
                });
            }
        });
    },
    readFile: function (req, res) {
        if (req.query.file) {
            var width;
            var height;
            if (req.query.width) {
                width = parseInt(req.query.width);
                if (_.isNaN(width)) {
                    width = undefined;
                }
            }
            if (req.query.height) {
                height = parseInt(req.query.height);
                if (_.isNaN(height)) {
                    height = undefined;
                }
            }
            Config.readUploaded(req.query.file, width, height, req.query.style, res);
        } else {
            res.callback("No Such File Found");
        }

    },
    // readAttachment: function(req, res){
    //     Config.readAttachment
    // },
    wallpaper: function (req, res) {
        Config.readUploaded(req.query.file, req.query.width, req.query.height, req.query.style, res);
    }
};