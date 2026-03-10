import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat8 "mo:core/Nat8";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type for AccessControl integration
  public type UserProfile = {
    name : Text;
    email : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  module Site {
    public func compare(site1 : Site, site2 : Site) : Order.Order {
      switch (Text.compare(site1.name, site2.name)) {
        case (#equal) { Text.compare(site1.clientName, site2.clientName) };
        case (order) { order };
      };
    };
  };

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Int.compare(transaction1.date, transaction2.date);
    };
  };

  module Labour {
    public func compare(labour1 : Labour, labour2 : Labour) : Order.Order {
      Text.compare(labour1.name, labour2.name);
    };
  };

  module WorkProgress {
    public func compareByTaskName(progress1 : WorkProgress, progress2 : WorkProgress) : Order.Order {
      Text.compare(progress1.taskName, progress2.taskName);
    };

    public func compareByProgress(progress1 : WorkProgress, progress2 : WorkProgress) : Order.Order {
      Nat8.compare(progress1.progressPercent, progress2.progressPercent);
    };
  };

  module Session {
    public func compare(session1 : Session, session2 : Session) : Order.Order {
      switch (Text.compare(session1.token, session2.token)) {
        case (#equal) { Text.compare(session1.userId, session2.userId) };
        case (order) { order };
      };
    };
  };

  public type Site = {
    id : Nat;
    name : Text;
    clientName : Text;
    location : Text;
    startDate : Time.Time;
    expectedEndDate : Time.Time;
    totalAmount : Float;
    notes : Text;
    status : SiteStatus;
  };

  public type SiteStatus = {
    #active;
    #completed;
  };

  public type Transaction = {
    id : Nat;
    siteId : Nat;
    date : Time.Time;
    transactionType : TransactionType;
    amount : Float;
    paymentMode : Text;
    notes : Text;
  };

  public type TransactionType = {
    #paymentReceived;
    #materialPurchase;
    #labourPayment;
    #miscExpense;
  };

  public type Labour = {
    id : Nat;
    siteId : Nat;
    name : Text;
    phone : Text;
    workType : Text;
    dailyWage : Float;
    totalPaid : Float;
    pendingPayment : Float;
  };

  public type WorkProgress = {
    id : Nat;
    siteId : Nat;
    taskName : Text;
    progressPercent : Nat8; // 0-100
    notes : Text;
  };

  // AUTH TYPES
  public type AppUser = {
    id : Nat;
    userId : Text;
    name : Text;
    email : Text;
    passwordHash : Text;
    createdAt : Time.Time;
  };

  public type Session = {
    token : Text;
    userId : Text;
    createdAt : Time.Time;
    expiresAt : Time.Time;
  };

  public type RegisterUserResult = {
    #ok : Nat;
    #userIdTaken;
    #emailTaken;
  };

  public type LoginResult = {
    #ok : Text;
    #invalidCredentials;
    #userNotFound;
  };

  public type SessionVerificationResult = {
    #ok : AppUser;
    #expired;
    #notFound;
  };

  public type ChangePasswordResult = {
    #ok;
    #invalidCredentials;
    #sessionInvalid;
  };

  var nextSiteId = 1;
  var nextTransactionId = 1;
  var nextLabourId = 1;
  var nextWorkProgressId = 1;
  var nextUserId = 1;

  let sites = Map.empty<Nat, Site>();
  let transactions = Map.empty<Nat, Transaction>();
  let labours = Map.empty<Nat, Labour>();
  let workProgressItems = Map.empty<Nat, WorkProgress>();
  let users = Map.empty<Text, AppUser>();
  let sessions = Map.empty<Text, Session>();

  // USER PROFILE FUNCTIONS (Required by instructions)
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

  // AUTH FUNCTIONS - Open to all (including anonymous/guests)
  public shared ({ caller }) func registerUser(userId : Text, name : Text, email : Text, password : Text) : async RegisterUserResult {
    switch (users.get(userId), users.values().find(func(u) { u.email == email })) {
      case (null, null) {
        let newUser : AppUser = {
          id = nextUserId;
          userId;
          name;
          email;
          passwordHash = password;
          createdAt = Time.now();
        };
        users.add(userId, newUser);
        nextUserId += 1;
        #ok(nextUserId - 1);
      };
      case (?_, _) { #userIdTaken };
      case (_, ?_) { #emailTaken };
    };
  };

  public shared ({ caller }) func loginUser(userId : Text, password : Text) : async LoginResult {
    switch (users.get(userId)) {
      case (null) { #userNotFound };
      case (?user) {
        if (user.passwordHash != password) {
          #invalidCredentials;
        } else {
          let token = userId # ":" # Time.now().toText();
          let session : Session = {
            token;
            userId;
            createdAt = Time.now();
            expiresAt = Time.now() + 2_592_000_000_000_000;
          };
          sessions.add(token, session);
          #ok(token);
        };
      };
    };
  };

  public shared ({ caller }) func verifySession(token : Text) : async SessionVerificationResult {
    switch (sessions.get(token)) {
      case (null) { #notFound };
      case (?session) {
        if (Time.now() > session.expiresAt) { #expired } else {
          switch (users.get(session.userId)) {
            case (null) { #notFound };
            case (?user) { #ok(user) };
          };
        };
      };
    };
  };

  public shared ({ caller }) func logoutSession(token : Text) : async () {
    sessions.remove(token);
  };

  public shared ({ caller }) func changePassword(token : Text, oldPassword : Text, newPassword : Text) : async ChangePasswordResult {
    switch (sessions.get(token)) {
      case (null) { #sessionInvalid };
      case (?session) {
        switch (users.get(session.userId)) {
          case (null) { #sessionInvalid };
          case (?user) {
            if (user.passwordHash != oldPassword) {
              #invalidCredentials;
            } else {
              let updatedUser = { user with passwordHash = newPassword };
              users.add(session.userId, updatedUser);
              #ok;
            };
          };
        };
      };
    };
  };

  // CRUD OPERATIONS FOR SITES - Open to all (including guests)
  public shared ({ caller }) func createSite(name : Text, clientName : Text, location : Text, startDate : Time.Time, expectedEndDate : Time.Time, totalAmount : Float, notes : Text) : async Nat {
    let site : Site = {
      id = nextSiteId;
      name;
      clientName;
      location;
      startDate;
      expectedEndDate;
      totalAmount;
      notes;
      status = #active;
    };
    sites.add(nextSiteId, site);
    nextSiteId += 1;
    site.id;
  };

  public shared ({ caller }) func updateSite(id : Nat, name : Text, clientName : Text, location : Text, startDate : Time.Time, expectedEndDate : Time.Time, totalAmount : Float, notes : Text, status : SiteStatus) : async () {
    switch (sites.get(id)) {
      case (null) { Runtime.trap("Site not found") };
      case (?_existing) {
        let updatedSite : Site = {
          id;
          name;
          clientName;
          location;
          startDate;
          expectedEndDate;
          totalAmount;
          notes;
          status;
        };
        sites.add(id, updatedSite);
      };
    };
  };

  public shared ({ caller }) func deleteSite(id : Nat) : async () {
    if (not sites.containsKey(id)) { Runtime.trap("Site not found") };
    sites.remove(id);
  };

  public query ({ caller }) func getSite(id : Nat) : async Site {
    switch (sites.get(id)) {
      case (null) { Runtime.trap("Site not found") };
      case (?site) { site };
    };
  };

  public query ({ caller }) func getAllSites() : async [Site] {
    sites.values().toArray().sort();
  };

  // CRUD OPERATIONS FOR TRANSACTIONS - Open to all
  public shared ({ caller }) func createTransaction(siteId : Nat, date : Time.Time, transactionType : TransactionType, amount : Float, paymentMode : Text, notes : Text) : async Nat {
    if (not sites.containsKey(siteId)) { Runtime.trap("Site not found") };
    let transaction : Transaction = {
      id = nextTransactionId;
      siteId;
      date;
      transactionType;
      amount;
      paymentMode;
      notes;
    };
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
    transaction.id;
  };

  public shared ({ caller }) func deleteTransaction(id : Nat) : async () {
    if (not transactions.containsKey(id)) { Runtime.trap("Transaction not found") };
    transactions.remove(id);
  };

  public query ({ caller }) func getTransaction(id : Nat) : async Transaction {
    switch (transactions.get(id)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) { transaction };
    };
  };

  public query ({ caller }) func getTransactionsBySiteId(siteId : Nat) : async [Transaction] {
    transactions.values().toArray().filter(func(t) { t.siteId == siteId }).sort();
  };

  // CRUD OPERATIONS FOR LABOUR - Open to all
  public shared ({ caller }) func createLabour(siteId : Nat, name : Text, phone : Text, workType : Text, dailyWage : Float) : async Nat {
    if (not sites.containsKey(siteId)) { Runtime.trap("Site not found") };
    let labour : Labour = {
      id = nextLabourId;
      siteId;
      name;
      phone;
      workType;
      dailyWage;
      totalPaid = 0.0;
      pendingPayment = 0.0;
    };
    labours.add(nextLabourId, labour);
    nextLabourId += 1;
    labour.id;
  };

  public shared ({ caller }) func updateLabour(id : Nat, name : Text, phone : Text, workType : Text, dailyWage : Float, totalPaid : Float, pendingPayment : Float) : async () {
    switch (labours.get(id)) {
      case (null) { Runtime.trap("Labour not found") };
      case (?existing) {
        let updatedLabour : Labour = {
          id;
          siteId = existing.siteId;
          name;
          phone;
          workType;
          dailyWage;
          totalPaid;
          pendingPayment;
        };
        labours.add(id, updatedLabour);
      };
    };
  };

  public shared ({ caller }) func deleteLabour(id : Nat) : async () {
    if (not labours.containsKey(id)) { Runtime.trap("Labour not found") };
    labours.remove(id);
  };

  public query ({ caller }) func getLabour(id : Nat) : async Labour {
    switch (labours.get(id)) {
      case (null) { Runtime.trap("Labour not found") };
      case (?labour) { labour };
    };
  };

  public query ({ caller }) func getLaboursBySiteId(siteId : Nat) : async [Labour] {
    let filtered = labours.values().toArray().filter(func(l) { l.siteId == siteId });
    filtered.sort();
  };

  // CRUD OPERATIONS FOR WORK PROGRESS - Open to all
  public shared ({ caller }) func createWorkProgress(siteId : Nat, taskName : Text, progressPercent : Nat8, notes : Text) : async Nat {
    if (not sites.containsKey(siteId)) { Runtime.trap("Site not found") };
    let workProgress : WorkProgress = {
      id = nextWorkProgressId;
      siteId;
      taskName;
      progressPercent;
      notes;
    };
    workProgressItems.add(nextWorkProgressId, workProgress);
    nextWorkProgressId += 1;
    workProgress.id;
  };

  public shared ({ caller }) func updateWorkProgress(id : Nat, taskName : Text, progressPercent : Nat8, notes : Text) : async () {
    switch (workProgressItems.get(id)) {
      case (null) { Runtime.trap("Work progress not found") };
      case (?existing) {
        let updatedWorkProgress : WorkProgress = {
          id;
          siteId = existing.siteId;
          taskName;
          progressPercent;
          notes;
        };
        workProgressItems.add(id, updatedWorkProgress);
      };
    };
  };

  public query ({ caller }) func getWorkProgress(id : Nat) : async WorkProgress {
    switch (workProgressItems.get(id)) {
      case (null) { Runtime.trap("Work progress not found") };
      case (?workProgress) { workProgress };
    };
  };

  public query ({ caller }) func getWorkProgressBySiteId(siteId : Nat) : async [WorkProgress] {
    workProgressItems.values().toArray().filter(func(w) { w.siteId == siteId });
  };
};
