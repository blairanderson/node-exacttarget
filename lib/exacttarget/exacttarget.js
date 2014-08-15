// external deps
var soap = require('soap'),
  async = require('async');

// local libs
var helpers = require('./helpers');

var WSDLS = {
  s0: "https://webservice.exacttarget.com/etframework.wsdl",
  s4: "https://webservice.s4.exacttarget.com/etframework.wsdl",     //(S4 instance)
  s6: "https://webservice.s6.exacttarget.com/etframework.wsdl",     //(S6 instance)
  s7: "https://webservice.s7.exacttarget.com/etframework.wsdl",     //(S7 instance)
  test: "https://webservice.test.exacttarget.com/etframework.wsdl", //(S7 instance)
};

function ExactTarget(opts) {
  this.version = "1.0.0";
  this.DEBUG = opts.DEBUG || false;
  // Likely that not everyone will be on this endpoint.
  // TODO iterate through all endpoints to confirm correct one.
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


ExactTarget.prototype.last = function (callback) {
  return callback(null, this.client.lastRequest);
};


//if (self.DEBUG) {
//  console.log("describe", client.describe());
//  var describe = client.describe().PartnerAPI.Soap;
//  Object.keys(describe).forEach(function (method) {
//    var pattern = describe[method];
//    console.log("----- START", method, " - input/output parameters:");
//    console.log(pattern);
//    console.log("----- END:", method);
//  });
//}

//if (this.isInit) {
//  return callback(null, {init: true});
//} else {
//  this.isInit = true;
//}


throw new Error("Start HERE");

ExactTarget.prototype.init = function (opts, callback) {
  var self = this;

  var urls = [];
  Object.keys(WSDLS).forEach(function (WSDL) {
    urls.push(WSDLS[WSDL]);
  });

  // TODO ITERATE OVER URLS TO FIND THE RIGHT ONE!

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


    // Make a Call to confirm the user is logged in.
    client.GetSystemStatus({}, function (err, resp) {
      if (err) {
        return callback(err, null);
      }

      if (!resp.status === "OK") {
        return callback("Authentication Failed",null)
      }

      self.client = client;
      return callback(null, resp);
    });
  });
};


ExactTarget.prototype.retrieve = function (options, callback) {
  var self = this;

  this.client.Retrieve(options, function (err, data) {
    if (err) {
      return callback(err);
    } else {
      if (self.DEBUG) {
        console.log("response", data);
      }

      return callback(null, data);
    }
  });
};

ExactTarget.prototype.AccountUser = function (opts, callback) {
  this.retrieve({
    RetrieveRequest: {
      ObjectType: "AccountUser",
      "Properties": [
        "Name",
        "AccountUserID",
        "ActiveFlag",
        "ChallengeAnswer",
        "ChallengePhrase",
        "CreatedDate",
        "CustomerKey",
        "Email",
        "ID",
        "IsAPIUser",
        "IsLocked",
        "LastSuccessfulLogin",
        "ModifiedDate",
        "MustChangePassword",
        "Name",
        "NotificationEmailAddress",
        "Password",
        "Roles",
        "UserID",
        "UserPermissions"
      ]
    }
  }, callback);
};


ExactTarget.prototype.subscribers = function (opts, callback) {
  this.retrieve({
    RetrieveRequest: {
      ObjectType: "Subscriber",
      "Properties": [
        "CreatedDate",
        "EmailAddress",
        "EmailTypePreference",
        "ID",
        "PartnerKey",
        "Status",
        "SubscriberKey",
        "UnsubscribedDate"
      ]
    }
  }, callback);
};

ExactTarget.prototype.subscribersEvents = function (opts, callback) {
  var self = this;
  async.parallel({
    BounceEvent: function (next) {
      self.BounceEvent({}, next);
    },

    ClickEvent: function (next) {
      self.ClickEvent({}, next);
    },

    ForwardedEmailEvent: function (next) {
      self.ForwardedEmailEvent({}, next);
    },

    ForwardedEmailOptInEvent: function (next) {
      self.ForwardedEmailOptInEvent({}, next);
    },

    NotSentEvent: function (next) {
      self.NotSentEvent({}, next);
    },

    OpenEvent: function (next) {
      self.OpenEvent({}, next);
    },

    SurveyEvent: function (next) {
      self.SurveyEvent({}, next);
    },

    UnsubEvent: function (next) {
      self.UnsubEvent({}, next);
    }
  }, function (error, results) {
    if (error) {
      return callback(error, null);
    }
    return callback(null, results);
  })
};

// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/bounceevent/
ExactTarget.prototype.BounceEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "BounceEvent",
      "Properties": [
        "BatchID",
        "BounceCategory",
        "BounceType",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "SendID",
        "SMTPCode",
        "SMTPReason",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};


// Retrieve Click Events http://help.exacttarget.com/en/technical_library/web_service_guide/objects/clickevent/
ExactTarget.prototype.ClickEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "ClickEvent",
      "Properties": [
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID",
        "URL",
        "URLID"
      ]
    }
  }, callback);
};

//http://help.exacttarget.com/en/technical_library/web_service_guide/objects/forwardedemailevent/
ExactTarget.prototype.ForwardedEmailEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "ForwardedEmailEvent",
      "Properties": [
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};


// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/forwardedemailoptinevent/
ExactTarget.prototype.ForwardedEmailOptInEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "ForwardedEmailOptInEvent",
      "Properties": [
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "OptInSubscriberKey",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};

// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/notsentevent/
ExactTarget.prototype.NotSentEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "NotSentEvent",
      "Properties": [
        "BatchID",
        "EventDate",
        "EventType",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};

// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/openevent/
ExactTarget.prototype.OpenEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "OpenEvent",
      "Properties": [
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};


// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/surveyevent/
ExactTarget.prototype.SurveyEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "SurveyEvent",
      "Properties": [
        "Answer",
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "Question",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};

// http://help.exacttarget.com/en/technical_library/web_service_guide/objects/unsubevent/
ExactTarget.prototype.UnsubEvent = function (opts, callback) {
  return this.retrieve({
    RetrieveRequest: {
      ObjectType: "UnsubEvent",
      "Properties": [
        "BatchID",
        "CreatedDate",
        "EventDate",
        "EventType",
        "ID",
        "IsMasterUnsubscribed",
        "ModifiedDate",
        "ObjectID",
        "PartnerKey",
        "SendID",
        "SubscriberKey",
        "TriggeredSendDefinitionObjectID"
      ]
    }
  }, callback);
};

