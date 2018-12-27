// Initialize Firebase
let config = {
	apiKey: "AIzaSyCkkEdBNDDh4kGZFOrhE1Pm4_Fn528m7ak",
	authDomain: "performance-management-chart.firebaseapp.com",
	databaseURL: "https://performance-management-chart.firebaseio.com",
	projectId: "performance-management-chart",
	storageBucket: "performance-management-chart.appspot.com",
	messagingSenderId: "835339356426"
};

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