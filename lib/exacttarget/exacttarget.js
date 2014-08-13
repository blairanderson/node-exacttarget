// external deps
var _ = require('lodash'),
  http = require('http'),
  soap = require('soap'),
  async = require('async');

// local libs
var helpers = require('./helpers');


function ExactTargetAPI(options) {
  this.version = "1.0.0";
  this.DEBUG = options.DEBUG || false;
  if (!options.username) {
    throw new Error('Missing Username');
  }

  if (!options.password) {
    throw new Error("Missing Password");
  }

  this.username = options.username;
  this.password = options.password;

  this.WSDL = "https://webservice.s7.exacttarget.com/etframework.wsdl";

}

module.exports = ExactTargetAPI;

ExactTargetAPI.prototype.init = function (opts, callback) {
  var self = this;

  soap.createClient(this.WSDL, function (err, client) {
    if (err) {
      return callback(err, null);
    }

    client.setSecurity(new soap.WSSecurity(self.username, self.password));

    if (self.DEBUG) console.log("describe", client.describe());

    // Make a Call to confirm the user is logged in.
    client.GetSystemStatus({}, function (err, resp) {
      if (err) {
        return callback(err, null);
      } else {
        self.client = client;
        return callback(null, resp);
      }
    });
  });
};

ExactTargetAPI.prototype.createExtract = function (opts, callback) {
  var extractOptions = {
    "StartDate": "1/1/2014 12:00:00 AM",
    "EndDate": "8/13/2014 10:00:00 AM",
    "ExtractSubscribers": true,
    "Format": "csv",
    "OutputFileName": "MyExtractFile.csv"
  };

  this.client.PartnerAPI.Soap.Extract(extractOptions, function (err, data) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, data);
    }
  });
};

ExactTargetAPI.prototype.trackExtract = function (opts, callback) {
  var retrieveOpts = {};

  this.client.PartnerAPI.Soap.Retrieve(retrieveOpts, function (err, data) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, data);
    }
  });
};
