import { takeLatest, put, all, call } from 'redux-saga/effects';

import { auth, googleProvider, createUserProfileDocument, getCurrentUser } from '../../firebase/firebase.utils';
import { signInSuccess, signInFailure, signOutSuccess, signOutFailure, signUpSuccess, signUpFailure } from './user.actions'
import UserActionTypes from './user.types';

//signin function
export function* getSnapshotFromUserAuth(userAuth, additionalData){
    try{
    const userRef = yield call(createUserProfileDocument, userAuth, additionalData);
    const userSnapshot = yield userRef.get();
    yield put(signInSuccess(
      {id: userSnapshot.id, ...userSnapshot.data()})
    );
  }catch(error){
    yield put(signInFailure(error));
  }
}

///////GOOGLE SIGNIN///////
//worker
export function* signInWithGoogle(){
  try{
    //need to access value returned
    const { user } = yield auth.signInWithPopup(googleProvider);
    yield getSnapshotFromUserAuth(user);
  }catch(error){
    yield put(signInFailure(error));
  }
}

//watcher
export function* onGoogleSignInStart(){
  yield takeLatest(UserActionTypes.GOOGLE_SIGN_IN_START, signInWithGoogle);
}


////////////EMAIL SIGNIN////////////
//worker
export function* signInWithEmail({payload: {email, password}}){
  try{
    const { user } = yield auth.signInWithEmailAndPassword(email, password);
    yield getSnapshotFromUserAuth(user);
  }catch(error){
    yield put(signInFailure(error));
  }
}

//watcher
export function* onEmailSignInStart(){
  yield takeLatest(UserActionTypes.EMAIL_SIGN_IN_START, signInWithEmail);
}


/////////CHECK USER Session//////////
//worker
export function* isUserAuthenticaed(){
  try{
    const userAuth = yield getCurrentUser();
    if(!userAuth) return;
    yield getSnapshotFromUserAuth(userAuth);
  }catch(error){
    yield put(signInFailure(error));
  }
}

//watcher
export function* onCheckUserSession(){
  yield takeLatest(UserActionTypes.CHECK_USER_SESSION, isUserAuthenticaed);
}


////////SIGNOUT///////////

//worker
export function* signOut() {
  try {
    yield auth.signOut();
    yield put(signOutSuccess());
  } catch (error) {
    yield put(signOutFailure(error));
  }
}


//watcher
export function* onSignOutStart(){
  yield takeLatest(UserActionTypes.SIGN_OUT_START, signOut)
}

/////SIGN UP///////

//worker
export function* signUp({payload: {email, password, displayName}}){
  try{
    const{ user } = yield auth.createUserWithEmailAndPassword(email, password);
    yield put(signUpSuccess({user, additionalData:{displayName}}));
  }catch(error){
    yield put(signUpFailure(error));
  }
}

//watcher
export function* onSignUpStart(){
  yield takeLatest(UserActionTypes.SIGN_UP_START, signUp);
}

//////SIGN IN, AFTER SIGN UP///////

export function* signInAfterSignUp({payload: {user, additionalData}}){
    yield getSnapshotFromUserAuth(user, additionalData);
}

//watcher
export function* onSignUpSuccess(){
  yield takeLatest(UserActionTypes.SIGN_UP_SUCCESS, signInAfterSignUp);
}

export function* userSagas(){
  yield all([
    call(onGoogleSignInStart), 
    call(onEmailSignInStart), 
    call(onCheckUserSession), 
    call(onSignOutStart),
    call(onSignUpStart),
    call(onSignUpSuccess)
  ]);
}