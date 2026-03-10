import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = { name : Text };
  type OldActor = { userProfiles : Map.Map<Principal, OldUserProfile> };
  type NewActor = { userProfiles : Map.Map<Principal, { name : Text; email : Text }> };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.userProfiles.map<Principal, OldUserProfile, { name : Text; email : Text }>(
      func(_principal, oldProfile) {
        { oldProfile with email = "" };
      }
    );
    { userProfiles = newProfiles };
  };
};
