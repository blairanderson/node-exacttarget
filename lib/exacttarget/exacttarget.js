// external deps
var _ = require('lodash'),
  http = require('http'),
  soap = require('soap'),
  async = require('async');

// local libs
var helpers = require('./helpers');

function ExactTarget(opts) {
  this.version = "1.0.0";
  this.DEBUG = opts.DEBUG || false;
  this.WSDL = "https://webservice.s7.exacttarget.com/etframework.wsdl";

  if (opts.token || opts.fueloauth) {

    this.token = opts.token || opts.fueloauth;

  } else {

    if (!opts.username) {
      throw new Error('Missing Username');
    }

    if (!opts.password) {
      throw new Error("Missing Password");
    }
    this.username = opts.username;
    this.password = opts.password;
  }
}

module.exports = ExactTarget;

ExactTarget.prototype.init = function (opts, callback) {
  var self = this;

  if (this.isInit) {
    return callback(null, {init: true});
  } else {
    this.isInit = true;
  }

  soap.createClient(this.WSDL, function (err, client) {
    if (err) {
      return callback(err, null);
    }

    if (self.token) {
      client.addSoapHeader({
        fueloauth: self.token,
        xmlns: "http://exacttarget.com"
      });
    } else {
      client.setSecurity(new soap.WSSecurity(self.username, self.password));
    }


    if (self.DEBUG) {
      console.log("describe", client.describe());
      console.log("retrieve", client.describe().PartnerAPI.Soap.Retrieve);
    }

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


ExactTarget.prototype.subscribers = function (opts, callback) {
  var options = {
    RetrieveRequest: {
      ObjectType: "Subscriber",
      "Properties": [
        "EmailTypePreference",
        "CreatedDate",
        "Client.ID",
        "EmailAddress",
        "SubscriberKey",
        "Status",
        "UnsubscribedDate"
      ]
    }
  };

  this.client.Retrieve(options, function (err, data) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, data);
    }
  });
};


ExactTarget.prototype.last = function (callback) {
  return callback(null, this.client.lastRequest);
};