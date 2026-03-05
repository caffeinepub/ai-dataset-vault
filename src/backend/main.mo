import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Option "mo:core/Option";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  type DatasetStatus = { #verified; #rejected; #compromised };
  type Metrics = { accuracy : Float; precision : Float; recall : Float };
  type AuditEvent = { #uploaded; #rejected; #verified; #tamperDetected; #trainingStarted };

  // Init file storage
  include MixinStorage();

  let datasets = Map.empty<Nat, Dataset>();
  var currentDatasetId = 0;
  var trainingUrl : ?Text = null;
  var trainingToken : ?Text = null;

  // Init authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profiles
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  type Dataset = {
    id : Nat;
    name : Text;
    ownerId : Principal;
    blob : Storage.ExternalBlob;
    hash : Text;
    qualityPercentage : Float;
    status : DatasetStatus;
    createdAt : Int;
    externalTrainingUrl : ?Text;
  };

  type ProofMissing = {
    message : Text;
    durationAvailable : Int;
  };

  module Dataset {
    public func compare(a : Dataset, b : Dataset) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func computeHash(_content : Storage.ExternalBlob) : Text {
    "mock_hash";
  };

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadDataset(name : Text, blob : Storage.ExternalBlob) : async {
    datasetId : ?Nat;
    qualityPercentage : Float;
    hash : Text;
    message : Text;
    _success : Bool;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload datasets");
    };

    let quality = 100.0; // Placeholder for quality, always 100% with file storage

    if (quality < 60.0) {
      return {
        datasetId = null;
        qualityPercentage = quality;
        hash = "";
        message = "Dataset quality below threshold";
        _success = false;
      };
    };

    currentDatasetId += 1;
    let newId = currentDatasetId;
    let hashRecord = computeHash(blob);

    let dataset : Dataset = {
      id = newId;
      name;
      ownerId = caller;
      blob;
      hash = hashRecord;
      qualityPercentage = quality;
      status = #verified;
      createdAt = Time.now();
      externalTrainingUrl = null;
    };
    datasets.add(newId, dataset);
    {
      datasetId = ?newId;
      qualityPercentage = quality;
      hash = hashRecord;
      message = "Dataset uploaded and verified";
      _success = true;
    };
  };

  public shared ({ caller }) func trainModel(datasetId : Nat) : async {
    metrics : [?Metrics];
    datasetIdResult : ?Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can train models");
    };

    switch (datasets.get(datasetId)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?dataset) {
        if (dataset.status != #verified) {
          Runtime.trap("Dataset not verified");
        };

        if (computeHash(dataset.blob) != dataset.hash) {
          datasets.add(
            datasetId,
            {
              id = dataset.id;
              name = dataset.name;
              ownerId = dataset.ownerId;
              blob = dataset.blob;
              hash = dataset.hash;
              qualityPercentage = dataset.qualityPercentage;
              status = #compromised;
              createdAt = dataset.createdAt;
              externalTrainingUrl = null;
            },
          );
          Runtime.trap("Dataset integrity compromised");
        };

        let simulatedMetrics : Metrics = {
          accuracy = 0.85_123_32;
          precision = 0.72_242_23;
          recall = 0.84_954_21;
        };

        {
          metrics = [?simulatedMetrics];
          datasetIdResult = ?dataset.id;
        };
      };
    };
  };

  public shared ({ caller }) func setExternalTrainingUrl(url : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    trainingUrl := ?url;
    trainingToken := ?url.concat("TOKEN_SUFFIX");
    ();
  };

  public query ({ caller }) func getExternalTrainingLink(datasetId : Nat) : async {
    url : Text;
    proofMissing : ?ProofMissing;
    token : ?Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access training links");
    };

    switch (datasets.get(datasetId)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?dataset) {
        if (dataset.status != #verified) {
          Runtime.trap("Only valid datasets can be used for training");
        };
        switch (trainingUrl, trainingToken) {
          case (?url, ?token) { { url; proofMissing = null; token = ?token } };
          case (?url, null) {
            {
              url;
              proofMissing = ?{
                message = "Time-recorded proof missing";
                durationAvailable = 3600;
              };
              token = null;
            };
          };
          case (null, _) { Runtime.trap("No training URL set") };
        };
      };
    };
  };

  public query ({ caller }) func getDatasets() : async [Dataset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access datasets");
    };
    datasets.values().toArray();
  };

  public query ({ caller }) func getDataset(id : Nat) : async Dataset {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access datasets");
    };
    switch (datasets.get(id)) {
      case (null) {
        Runtime.trap("Dataset does not exist");
      };
      case (?dataset) {
        dataset;
      };
    };
  };

  public shared ({ caller }) func deleteDataset(id : Nat) : async () {
    switch (datasets.get(id)) {
      case (null) { Runtime.trap("Dataset not found") };
      case (?dataset) {
        if (caller != dataset.ownerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only owner or admin can delete this dataset");
        };
        datasets.remove(id);
      };
    };
  };
};
