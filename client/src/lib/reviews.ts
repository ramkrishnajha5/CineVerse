import {
    doc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    deleteDoc,
    updateDoc,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Review = {
    id?: string;
    tmdbId: number;
    mediaType: "movie" | "tv";
    userId: string;
    userName: string;
    userPhotoURL: string | null;
    rating: number; // 1-10
    comment: string; // Can be empty (rating only)
    createdAt?: Timestamp | null;
    updatedAt?: Timestamp | null;
};

// Add or update a review
export async function addReview(review: Omit<Review, "id" | "createdAt" | "updatedAt">) {
    const reviewsRef = collection(db, "reviews");

    // Check if user already has a review for this media
    const existingQuery = query(
        reviewsRef,
        where("tmdbId", "==", review.tmdbId),
        where("userId", "==", review.userId)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
        // Update existing review
        const existingDoc = existingSnap.docs[0];
        await updateDoc(doc(db, "reviews", existingDoc.id), {
            rating: review.rating,
            comment: review.comment,
            userName: review.userName,
            userPhotoURL: review.userPhotoURL,
            updatedAt: serverTimestamp(),
        });
        return existingDoc.id;
    }

    // Add new review
    const docRef = await addDoc(reviewsRef, {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

// Get all reviews for a movie/TV show - Simple query without orderBy to avoid index requirement
export async function getReviews(tmdbId: number): Promise<Review[]> {
    const reviewsRef = collection(db, "reviews");

    // Simple query - just filter by tmdbId (no orderBy to avoid composite index)
    const q = query(
        reviewsRef,
        where("tmdbId", "==", tmdbId)
    );

    const snap = await getDocs(q);
    const reviews = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
    } as Review));

    // Sort client-side by createdAt (newest first)
    return reviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
}

// Get user's review for a specific movie/TV show
export async function getUserReview(tmdbId: number, userId: string): Promise<Review | null> {
    const reviewsRef = collection(db, "reviews");
    const q = query(
        reviewsRef,
        where("tmdbId", "==", tmdbId),
        where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Review;
}

// Delete a review
export async function deleteReview(reviewId: string) {
    await deleteDoc(doc(db, "reviews", reviewId));
}

// Get average rating - uses getReviews to avoid additional queries
export async function getAverageRating(tmdbId: number): Promise<{ average: number; count: number }> {
    const reviews = await getReviews(tmdbId);
    if (reviews.length === 0) return { average: 0, count: 0 };

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return {
        average: Number((total / reviews.length).toFixed(1)),
        count: reviews.length
    };
}
