import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@shared/schema';

export const registerUser = async (email: string, password: string, firstName: string, lastName: string, companyName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userData: User = {
    uid: user.uid,
    email: user.email!,
    firstName,
    lastName,
    companyName,
    displayName: `${firstName} ${lastName}`,
    trialStartDate: new Date(),
    isSubscriber: false,
    isSuspended: false,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await setDoc(doc(db, 'users', user.uid), userData);
  return userData;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const deleteAccount = async (password: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  const credential = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, credential);
  
  // Delete user data from Firestore
  await deleteDoc(doc(db, 'users', user.uid));
  
  // Delete user account
  await deleteUser(user);
};

export const getUserData = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
};

export const checkTrialStatus = (user: User): boolean => {
  console.log('=== TRIAL STATUS CHECK ===');
  console.log('User admin:', user.isAdmin);
  
  if (user.isAdmin) {
    console.log('User is admin - granting access');
    return true;
  }
  
  // Check if subscription is active based on current time
  const hasActiveSubscription = user.subscriptionCurrentPeriodEnd && 
    new Date(user.subscriptionCurrentPeriodEnd) > new Date();
  
  console.log('Subscription current period end:', user.subscriptionCurrentPeriodEnd);
  console.log('Current time:', new Date().toISOString());
  console.log('Has active subscription:', hasActiveSubscription);
  
  if (hasActiveSubscription) {
    console.log('Active subscription found - granting access');
    return true;
  }
  
  let trialStart: Date;
  
  // Handle Firestore Timestamp objects
  if (user.trialStartDate && typeof user.trialStartDate === 'object' && 'seconds' in user.trialStartDate) {
    trialStart = new Date((user.trialStartDate as any).seconds * 1000);
  } else {
    trialStart = new Date(user.trialStartDate);
  }
  
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log('Trial start date:', trialStart.toISOString());
  console.log('Days since trial start:', daysDiff);
  console.log('Trial valid (< 7 days):', daysDiff < 7);
  console.log('==========================');
  
  return daysDiff < 7;
};

export const makeUserAdmin = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    isAdmin: true,
    isSubscriber: true,
    isSuspended: false,
    updatedAt: new Date()
  }, { merge: true });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return userDoc.data() as User;
  }
  return null;
};
