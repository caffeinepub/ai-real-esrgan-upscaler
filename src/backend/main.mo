import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Component: Storage
  include MixinStorage();

  // Component: Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  // Job Management
  type Job = {
    id : Text;
    userId : Principal;
    originalBlobId : Text;
    resultBlobId : ?Text;
    enhancementType : Text;
    scale : Nat;
    status : Text;
    errorMessage : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };

  module Job {
    public func compare(a : Job, b : Job) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  var nextJobId = 0;
  let jobs = Map.empty<Text, Job>();

  func generateJobId() : Text {
    let id = nextJobId;
    nextJobId += 1;
    id.toText();
  };

  public shared ({ caller }) func submitJob(originalBlobId : Text, enhancementType : Text, scale : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit jobs");
    };

    let jobId = generateJobId();
    let now = Time.now();

    let job : Job = {
      id = jobId;
      userId = caller;
      originalBlobId;
      resultBlobId = null;
      enhancementType;
      scale;
      status = "pending";
      errorMessage = null;
      createdAt = now;
      updatedAt = now;
    };

    jobs.add(jobId, job);
    jobId;
  };

  public query ({ caller }) func getJob(jobId : Text) : async ?Job {
    switch (jobs.get(jobId)) {
      case (null) { null };
      case (?job) {
        // Only the job owner or admin can view the job
        if (job.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own jobs");
        };
        ?job;
      };
    };
  };

  public query ({ caller }) func listMyJobs() : async [Job] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list their jobs");
    };

    jobs.values().toArray().filter(
      func(job) {
        job.userId == caller;
      }
    );
  };

  public shared ({ caller }) func deleteJob(jobId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete jobs");
    };

    switch (jobs.get(jobId)) {
      case (null) { return false };
      case (?job) {
        if (job.userId != caller) {
          Runtime.trap("Unauthorized: Can only delete your own jobs");
        };
        jobs.remove(jobId);
        true;
      };
    };
  };

  public shared ({ caller }) func processJob(jobId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can process jobs");
    };

    let job = switch (jobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) { job };
    };

    let updatedJob : Job = {
      job with
      status = "processing";
      updatedAt = Time.now();
    };
    jobs.add(jobId, updatedJob);

    let response = await makeHttpOutcall(job);
    response;
  };

  public query func getStats() : async { totalJobs : Nat; completedJobs : Nat; failedJobs : Nat } {
    var totalJobs = 0;
    var completedJobs = 0;
    var failedJobs = 0;

    for (job in jobs.values()) {
      totalJobs += 1;
      if (job.status == "done") {
        completedJobs += 1;
      } else if (job.status == "failed") {
        failedJobs += 1;
      };
    };

    { totalJobs; completedJobs; failedJobs };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func makeHttpOutcall(job : Job) : async Bool {
    let apiUrl = "https://external.api.endpoint/process";
    let requestBody = "{ \"originalBlobId\": \"" # job.originalBlobId # "\", \"enhancementType\": \"" # job.enhancementType # "\", \"scale\": " # job.scale.toText() # " }";

    let response = await OutCall.httpPostRequest(apiUrl, [], requestBody, transform);
    let updatedJob : Job = {
      job with
      status = "done";
      resultBlobId = ?response;
      updatedAt = Time.now();
    };
    jobs.add(job.id, updatedJob);
    true;
  };
};
