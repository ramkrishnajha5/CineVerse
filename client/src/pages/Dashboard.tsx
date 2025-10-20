import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { getUserProfile, updateUserProfile, getWatchlist, getFavourites, removeFromWatchlist, removeFromFavourites, type MediaItem, type UserProfile } from "@/lib/firestore";
import { countries } from "@/lib/countries";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";

export default function Dashboard() {
  const { user, signOutUser, deleteAccount } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [active, setActive] = useState<"profile" | "watchlist" | "favourites">("profile");
  const uid = user?.uid || "";
  const userEmail = user?.email || "";
  
  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  // Check if user is Google user
  useEffect(() => {
    if (user) {
      const googleUser = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      setIsGoogleUser(googleUser);
    }
  }, [user]);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Lists state
  const [watchlist, setWatchlist] = useState<(MediaItem & { id?: string })[]>([]);
  const [favourites, setFavourites] = useState<(MediaItem & { id?: string })[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const canLoad = useMemo(() => Boolean(uid), [uid]);

  // Full alphabetical country list imported from lib/countries

  // Load profile on mount and when user changes
  useEffect(() => {
    if (!canLoad) return;
    const load = async () => {
      try {
        setProfileLoading(true);
        const p = await getUserProfile(uid);
        if (p) {
          setProfile(p);
        } else {
          // Create default profile in Firestore if it doesn't exist
          const defaultName = (userEmail.split("@")[0] || "User");
          const defaultProfile = { name: defaultName, profilePicture: "", gender: "", age: "", country: "" };
          await updateUserProfile(uid, defaultProfile);
          setProfile(defaultProfile);
        }
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  }, [canLoad, uid, userEmail]);

  // Load lists when switching tabs to lists or when user changes
  useEffect(() => {
    if (!canLoad) return;
    if (active === "watchlist" || active === "favourites") {
      const loadLists = async () => {
        setListsLoading(true);
        try {
          if (active === "watchlist") {
            const wl = await getWatchlist(uid);
            setWatchlist(wl);
          } else {
            const fav = await getFavourites(uid);
            setFavourites(fav);
          }
        } finally {
          setListsLoading(false);
        }
      };
      loadLists();
    }
  }, [active, canLoad, uid]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 bg-card border rounded-lg p-4 sticky top-20 h-max flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
          <nav className="space-y-2">
            {(["profile","watchlist","favourites"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full text-left px-3 py-2 rounded ${active===key?"bg-primary text-primary-foreground":"hover:bg-accent"}`}
              >
                {key === "profile" ? "Profile" : key === "watchlist" ? "My Watchlist" : "My Favourites"}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-4 space-y-2">
            <button
              onClick={async () => { await signOutUser(); navigate('/'); }}
              className="w-full px-3 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-transform hover:scale-[1.01] shadow-sm"
            >
              Logout
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-transform hover:scale-[1.01] shadow-sm text-sm"
            >
              Delete Account
            </button>
          </div>
        </aside>
        <section className="col-span-12 md:col-span-9">
          {active === "profile" && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Profile</h3>
                <div className="flex gap-2">
                  {!profileLoading && (
                    <>
                      <button
                        className="px-3 py-1 rounded border hover:bg-accent text-sm"
                        onClick={async () => {
                          setProfileLoading(true);
                          const p = await getUserProfile(uid);
                          if (p) setProfile(p);
                          setProfileLoading(false);
                        }}
                      >
                        Refresh
                      </button>
                      <button
                        className="px-3 py-1 rounded border hover:bg-accent text-sm"
                        onClick={() => setEditing((v) => !v)}
                      >
                        {editing ? 'Cancel' : 'Edit'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {profileLoading ? (
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              ) : !editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 md:col-span-2">
                    {profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center text-xl">
                        {(profile?.name?.[0] || userEmail?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-medium">{profile?.name || userEmail.split('@')[0] || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{userEmail}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Gender</div>
                    <div className="text-base">{profile?.gender || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Age</div>
                    <div className="text-base">{profile?.age ? `${profile.age} Years` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Country</div>
                    <div className="text-base">{profile?.country || '-'}</div>
                  </div>
                </div>
              ) : (
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!uid) return;
                    try {
                      setProfileMsg(null);
                      await updateUserProfile(uid, profile || {});
                      // Fetch fresh profile data from Firestore
                      const updatedProfile = await getUserProfile(uid);
                      if (updatedProfile) setProfile(updatedProfile);
                      setProfileMsg("Profile updated");
                      setEditing(false);
                    } catch (err: any) {
                      setProfileMsg(err?.message || "Failed to update profile");
                    }
                  }}
                >
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      value={profile?.name || ""}
                      onChange={(e) => setProfile((p) => ({ ...(p||{name:"",profilePicture:"",gender:"",age:"",country:""}), name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Gender</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      value={profile?.gender || ""}
                      onChange={(e) => setProfile((p) => ({ ...(p||{name:"",profilePicture:"",gender:"",age:"",country:""}), gender: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Age</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      value={profile?.age || ""}
                      onChange={(e) => setProfile((p) => ({ ...(p||{name:"",profilePicture:"",gender:"",age:"",country:""}), age: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Country</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      value={profile?.country || ""}
                      onChange={(e) => setProfile((p) => ({ ...(p||{name:"",profilePicture:"",gender:"",age:"",country:""}), country: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Upload Profile Picture (Cloudinary)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setProfileMsg('Uploading profile picture...');
                            const res = await uploadImageToCloudinary(file, { folder: `users/${uid}` });
                            // Save to Firestore immediately
                            await updateUserProfile(uid, { ...profile, profilePicture: res.secure_url });
                            // Refresh from Firestore to ensure sync
                            const updatedProfile = await getUserProfile(uid);
                            if (updatedProfile) setProfile(updatedProfile);
                            setProfileMsg('✅ Profile picture uploaded and saved!');
                          } catch (err: any) {
                            setProfileMsg(err?.message || 'Upload failed');
                          }
                        }}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                      />
                    {profile?.profilePicture && (
                      <div className="mt-2">
                        <img src={profile.profilePicture} alt="Profile" className="w-14 h-14 rounded-full object-cover border" />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground">Save Profile</button>
                    {profileMsg && <span className="text-sm text-muted-foreground">{profileMsg}</span>}
                  </div>
                </form>
              )}
            </div>
          )}
          {active === "watchlist" && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">My Watchlist</h3>
                <button
                  className="text-sm underline"
                  onClick={async () => { if (!uid) return; setListsLoading(true); const wl = await getWatchlist(uid); setWatchlist(wl); setListsLoading(false); }}
                >Refresh</button>
              </div>
              {listsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : watchlist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items saved yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchlist.map(item => (
                    <div key={`${item.mediaType}-${item.tmdbId}`} className="rounded border bg-card overflow-hidden group">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`)}
                      >
                        {item.posterPath ? (
                          <img src={`https://image.tmdb.org/t/p/w300${item.posterPath}`} alt={item.title} className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center text-sm text-muted-foreground group-hover:bg-zinc-700 transition-colors">No poster</div>
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-between gap-2">
                        <div 
                          className="text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors flex-1" 
                          title={item.title}
                          onClick={() => navigate(item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`)}
                        >{item.title}</div>
                        <button
                          className="text-xs text-red-400 hover:text-red-300 shrink-0"
                          onClick={async () => {
                            if (!uid) return;
                            await removeFromWatchlist(uid, item.tmdbId);
                            setWatchlist((arr) => arr.filter(x => x.tmdbId !== item.tmdbId));
                          }}
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {active === "favourites" && (
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">My Favourites</h3>
                <button
                  className="text-sm underline"
                  onClick={async () => { if (!uid) return; setListsLoading(true); const fav = await getFavourites(uid); setFavourites(fav); setListsLoading(false); }}
                >Refresh</button>
              </div>
              {listsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : favourites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items saved yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favourites.map(item => (
                    <div key={`${item.mediaType}-${item.tmdbId}`} className="rounded border bg-card overflow-hidden group">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`)}
                      >
                        {item.posterPath ? (
                          <img src={`https://image.tmdb.org/t/p/w300${item.posterPath}`} alt={item.title} className="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity" />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center text-sm text-muted-foreground group-hover:bg-zinc-700 transition-colors">No poster</div>
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-between gap-2">
                        <div 
                          className="text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors flex-1" 
                          title={item.title}
                          onClick={() => navigate(item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/movie/${item.tmdbId}`)}
                        >{item.title}</div>
                        <button
                          className="text-xs text-red-400 hover:text-red-300 shrink-0"
                          onClick={async () => {
                            if (!uid) return;
                            await removeFromFavourites(uid, item.tmdbId);
                            setFavourites((arr) => arr.filter(x => x.tmdbId !== item.tmdbId));
                          }}
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
      
      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All your data including profile, watchlist, and favorites will be permanently deleted.
            </p>
            <p className="text-sm font-medium mb-2">
              Please enter your email <span className="text-primary">{userEmail}</span> to confirm:
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white mb-3"
              disabled={isDeleting}
            />
            {!isGoogleUser && (
              <>
                <p className="text-sm font-medium mb-2">
                  Enter your password to confirm:
                </p>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white mb-4"
                  disabled={isDeleting}
                />
              </>
            )}
            {isGoogleUser && (
              <p className="text-sm text-muted-foreground mb-4">
                You'll be prompted to re-authenticate with Google before deletion.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteEmailInput("");
                  setDeletePasswordInput("");
                }}
                className="flex-1 px-4 py-2 rounded border hover:bg-accent"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteEmailInput.trim() !== userEmail) {
                    toast({ title: "Email doesn't match", variant: "destructive" });
                    return;
                  }
                  if (!isGoogleUser && !deletePasswordInput.trim()) {
                    toast({ title: "Password is required", variant: "destructive" });
                    return;
                  }
                  try {
                    setIsDeleting(true);
                    await deleteAccount(deletePasswordInput || undefined);
                    toast({ title: "Account deleted successfully" });
                    navigate('/');
                  } catch (error: any) {
                    const errorMessage = getAuthErrorMessage(error);
                    toast({ 
                      title: "Failed to delete account", 
                      description: errorMessage,
                      variant: "destructive" 
                    });
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting || deleteEmailInput.trim() !== userEmail || (!isGoogleUser && !deletePasswordInput.trim())}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
