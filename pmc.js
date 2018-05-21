// Initialize Firebase
var config = {
	apiKey: "AIzaSyCkkEdBNDDh4kGZFOrhE1Pm4_Fn528m7ak",
	authDomain: "performance-management-chart.firebaseapp.com",
	databaseURL: "https://performance-management-chart.firebaseio.com",
	projectId: "performance-management-chart",
	storageBucket: "performance-management-chart.appspot.com",
	messagingSenderId: "835339356426"
};
firebase.initializeApp(config);

let chart = '';
let uid = '';
let visibleDates = 30;
let ctx = document.getElementById('powerGraph').getContext('2d');
let fireBaseData = [];
let chartObject = {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
    		type: 'line',
        label: "Fitness (CTL)",
        backgroundColor: 'rgba(100,146,182, 0.2)',
        borderColor: 'rgb(100,146,182, 0.8)',
        data: []
    }, {
    		type: 'line',
        label: "Fatigue (ATL)",
        backgroundColor: 'rgba(242,140,222, 0.2)',
        borderColor: 'rgba(242,140,222, 0.8)',
        data: []
    }, {
    		type: 'line',
        label: "Form (TSB)",
        backgroundColor: 'rgba(246,192,119, 0.2)',
        borderColor: 'rgba(246,192,119, 0.8)',
        data: []
    }, {
    		type: 'bubble',
        label: 'Daily TSS',
        backgroundColor: 'rgba(253, 101, 133, 0.6)',
      	borderColor: 'rgba(253, 101, 133, 0.8)',
        data: []
    }]
  }, 
  options: {
  	legend: {
  		position: "bottom"
  	}
  } 
};


initApp()
// getFirebaseData2();

document.getElementById("submitVisibleDates").addEventListener("click", event => {
	event.preventDefault();
	visibleDates = document.getElementById("visibleDatesInput").value;
	chartObject.data.labels = [];
	getFirebaseData();
	document.getElementById("visibleDatesInput").value = "";
})

document.getElementById("submitTSS").addEventListener("click", event => {
	event.preventDefault();

	let submittedTSS = document.getElementById("submittedTSS").value;
	let submittedDate = document.getElementById("submittedDate").value;
	let convertedDate = moment(submittedDate).unix();

	postFirebaseData({date: convertedDate,tss: submittedTSS});
	getFirebaseData();

	document.getElementById("submittedTSS").value = "";
	document.getElementById("submittedDate").value = "";
});

function createChart(days) {
	setChartDateLabels(days);
	calulateGraphData(days, fireBaseData);
	chart = new Chart(ctx, chartObject);
}

function calulateGraphData(days, data) {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;

	createBubbleChartData(days, data);

	for (var i = 0; i < days; i++) {
		ctlTSS = 0;
		atlTSS = 0;
		data.forEach(function(item, index){
			tss = parseInt(item.values.tss);

			if (index > 42) {
				return;
			} else {
				ctlTSS += tss;
				if (index < 7) {
					atlTSS += tss;
				}
			} 
		})
		data.shift();

		CTL = (ctlTSS/42).toFixed(2);
		ATL = (atlTSS/7).toFixed(2);
		TSB = (CTL - ATL).toFixed(2);
		chartObject.data.datasets[0].data.unshift(CTL);
		chartObject.data.datasets[1].data.unshift(ATL);
		chartObject.data.datasets[2].data.unshift(TSB);
	}		
}

function setChartDateLabels(howMany) {
	chartObject.data.labels.unshift(moment().add(1, 'days').format("M/DD"));
	for (var i = 0; i < howMany; i++) {
		chartObject.data.labels.unshift(moment().subtract(i, 'days').format("M/DD"));
	}
}

function createBubbleChartData(howMany, data) {
	let descendingDates = [];
	let startDate = data[0].values.date;

	for (var i = 0; i < howMany; i++) {
		descendingDates.push(moment.unix(startDate).subtract(i, 'days').format('M/DD'));
	}

	for (var j = 0; j < descendingDates.length; j++) {
		let pushZero = false;
		for (var k = 0; k < data.length; k++) {
			let compareDate = moment.unix(data[k].values.date).format('M/DD');

			if (descendingDates[j] === compareDate) {
				chartObject.data.datasets[3].data.unshift({y: data[k].values.tss, r: 3});	
				pushZero = false;
				break;
			} else {
				pushZero = true;	
			}
		}
		if (pushZero) {
			chartObject.data.datasets[3].data.unshift({y: 0, r: 3});
		} 
	}
}

function getFirebaseData(uid) {
	if (chart.length) {
		chart.destroy();
	}

	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/.json`)
		.then(response => response.json())
		.then(response => {

			if (response === null) {
				document.getElementById('dataAlert')
			} else {
				let responseArray = [];
				let responseKeys = Object.keys(response);
				let responseValues = Object.values(response);

				responseKeys.forEach((value, index) => {
					let responseObject = new Object();

					responseObject.key = value;
					responseObject.values = responseValues[index];
					responseArray.unshift(responseObject);
				})

				fireBaseData = responseArray.sort(a, b => b.values.date - a.values.date);
				createChart(visibleDates);
			}
		})
}

function postFirebaseData(object) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/.json`, {
		method: 'POST',
		type: 'JSON',
		body: `{"date": "${object.date}","tss": "${object.tss}"}`
	})
}

function initApp() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      uid = user.uid;
      getFirebaseData(uid);
    } else {
      window.location.assign("https://fredlintz5.github.io/performanceManagementChartRipoff/");
    }
  }, error => console.log(error));
};

function signOut() {
  firebase.auth().signOut()
  	.then(() => window.location.assign("https://fredlintz5.github.io/performanceManagementChartRipoff/"))
  	.catch(error => console.log(error));
}


// Fitness (CTL) is a rolling 42 day average of your daily TSS.
// Fatigue (ATL) is a 7 day average of your TSS that accounts for the workouts you have done recently.
// Form (TSB) is the balance of TSS equal to yesterday's fitness minus yesterday's fatigue.