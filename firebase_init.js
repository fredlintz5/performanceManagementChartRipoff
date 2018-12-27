// Initialize Firebase
firebase.initializeApp(config);

if ($('#firebaseui-auth-container').length) {
	// FirebaseUI config
	let uiConfig = {
	  signInSuccessUrl: 'pmc.html',
	  signInOptions: [ firebase.auth.GoogleAuthProvider.PROVIDER_ID ]
	};
	// Initialize the FirebaseUI Widget using Firebase.
	let ui = new firebaseui.auth.AuthUI(firebase.auth());

	ui.start('#firebaseui-auth-container', uiConfig);
}