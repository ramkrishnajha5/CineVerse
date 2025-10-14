import { doc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, where, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type MediaItem = {
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  mediaType: "movie" | "tv";
  addedAt?: any;
};

export type UserProfile = {
  name: string;
  profilePicture: string;
  gender: string;
  age: string;
  country: string;
};

export async function ensureUserDoc(uid: string, profile?: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  return (snap.exists() ? (snap.data() as UserProfile) : null);
}

export async function updateUserProfile(uid: string, profile: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addToWatchlist(uid: string, item: MediaItem) {
  const ref = collection(doc(db, "users", uid), "watchlist");
  await addDoc(ref, { ...item, addedAt: serverTimestamp() });
}

export async function addToFavourites(uid: string, item: MediaItem) {
  const ref = collection(doc(db, "users", uid), "favorites");
  await addDoc(ref, { ...item, addedAt: serverTimestamp() });
}

export async function getWatchlist(uid: string) {
  const ref = collection(doc(db, "users", uid), "watchlist");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MediaItem) }));
}

export async function getFavourites(uid: string) {
  const ref = collection(doc(db, "users", uid), "favorites");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MediaItem) }));
}

export async function isInWatchlist(uid: string, tmdbId: number) {
  const ref = collection(doc(db, "users", uid), "watchlist");
  const q = query(ref, where("tmdbId", "==", tmdbId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function isInFavourites(uid: string, tmdbId: number) {
  const ref = collection(doc(db, "users", uid), "favorites");
  const q = query(ref, where("tmdbId", "==", tmdbId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function removeFromWatchlist(uid: string, tmdbId: number) {
  const ref = collection(doc(db, "users", uid), "watchlist");
  const q = query(ref, where("tmdbId", "==", tmdbId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, `users/${uid}/watchlist/${d.id}`))));
}

export async function removeFromFavourites(uid: string, tmdbId: number) {
  const ref = collection(doc(db, "users", uid), "favorites");
  const q = query(ref, where("tmdbId", "==", tmdbId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, `users/${uid}/favorites/${d.id}`))));
}

// Upload a profile picture file for the user and return its public download URL
export async function uploadUserProfilePicture(uid: string, file: File) {
  const objectRef = ref(storage, `users/${uid}/profile_${Date.now()}`);
  const res = await uploadBytes(objectRef, file, { contentType: file.type });
  const url = await getDownloadURL(res.ref);
  return url;
}
