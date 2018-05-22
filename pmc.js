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
let userEmail = '';
let visibleDates = 60;
let ctx = document.getElementById('powerGraph').getContext('2d');
let fireBaseData = [];
let chartObject = {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
    		type: 'line',
        label: "Fitness (CTL)",
        yAxisID: 'A',
        backgroundColor: 'rgba(100,146,182, 0.2)',
        borderColor: 'rgb(100,146,182, 0.8)',
        data: []
    }, {
    		type: 'line',
        label: "Fatigue (ATL)",
        yAxisID: 'A',
        fill: false,
        backgroundColor: 'rgba(242,140,222, 0.2)',
        borderColor: 'rgba(242,140,222, 0.8)',
        data: []
    }, {
    		type: 'line',
        label: "Form (TSB)",
        yAxisID: 'B',
        fill: false,
        backgroundColor: 'rgba(246,192,119, 0.2)',
        borderColor: 'rgba(246,192,119, 0.8)',
        data: []
    }, {
    		type: 'bubble',
        label: 'Daily TSS',
        yAxisID: 'C',
        backgroundColor: 'rgba(253, 101, 133, 0.6)',
      	borderColor: 'rgba(253, 101, 133, 0.8)',
        data: []
    }]
  }, 
  options: {
  	legend: {
  		position: "bottom"
  	}, 
  	scales: {
      yAxes: [{
        id: 'A',
        type: 'linear',
        position: 'right',
        ticks: {max: 150,min: 0},
        gridlines: {display: false}
      }, {
        id: 'B',
        type: 'linear',
        position: 'left',
        ticks: {max: 30,min: -30},
        gridlines: {display: false}
      }, {
        id: 'C',
        type: 'linear',
        position: 'right',
        ticks: {max: 250,min: 0},
        gridlines: {display: false}
      }],
      xAxes: [{gridLines: {display:false}}]
    }
  } 
};

initApp()

document.getElementById("submitVisibleDates").addEventListener("click", event => {
	event.preventDefault();
	visibleDates = document.getElementById("visibleDatesInput").value;
	chartObject.data.labels = [];
	getFirebaseData(uid);
	document.getElementById("visibleDatesInput").value = "";
})

document.getElementById("submitTSS").addEventListener("click", event => {
	event.preventDefault();

	let submittedTSS = document.getElementById("submittedTSS").value;
	let submittedDate = document.getElementById("submittedDate").value;
	let convertedDate = moment(submittedDate).unix();

	postFirebaseData({date: convertedDate,tss: submittedTSS});
	getFirebaseData(uid);

	document.getElementById("submittedTSS").value = "";
	document.getElementById("submittedDate").value = "";
})

function createChart(days, data) {
	setChartDateLabels(days, data);
	calulateGraphData(days, data);
	chart = new Chart(ctx, chartObject);
}

function setChartDateLabels(days, data) {
	chartObject.data.labels.unshift(moment().add(1, 'days').format("M/DD"));

	let labelArray = Object.keys(data);
	for (var i = 0; i < days; i++) {
		chartObject.data.labels.unshift(labelArray[i]);
	}
}

function calulateGraphData(days, data) {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;

	let tssArray = Object.values(data);

	for (var i = 0; i < days; i++) {
		ctlTSS = 0;
		atlTSS = 0;
		chartObject.data.datasets[3].data.unshift({y: tssArray[i], r: 3});

		for (var j = 0; tssArray.length; j++) {
			tss = parseInt(tssArray[j]);

			if (j == 42) {
				return;
			} else {
				ctlTSS += tss;
				if (j < 7) {
					atlTSS += tss;
				}
			} 
		}
		tssArray.shift();

		CTL = (ctlTSS/42).toFixed(2);
		ATL = (atlTSS/7).toFixed(2);
		TSB = (CTL - ATL).toFixed(2);
		chartObject.data.datasets[0].data.unshift(CTL);
		chartObject.data.datasets[1].data.unshift(ATL);
		chartObject.data.datasets[2].data.unshift(TSB);
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
				alert('Add some data to get Chart to Display');
				return;
			} else {
				let arrayLength = 0;
				let compareDate = '';
				let descendingDates = {};
				let startDate = moment().unix();
				let responseValues = Object.values(response);
				
				for (var i = 0; i < visibleDates; i++) {
					descendingDates[moment.unix(startDate).subtract(i, 'days').format('M/DD')] = 0;
				}

				responseValues.length > visibleDates ? arrayLength = visibleDates : arrayLength = responseValues.length;

				for (var j = 0; j < arrayLength; j++) {
					responseValues[j].tss === undefined ? tss = 0 : tss = parseInt(responseValues[j].tss);
					compareDate = moment.unix(responseValues[j].date).format('M/DD');
					descendingDates[compareDate] += tss;
				}

				createChart(visibleDates, descendingDates);
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
     	userEmail = user.email;
      getFirebaseData(uid);
      document.getElementById("welcome").innerHTML = `<h4>${userEmail}</h4>`
    } else {
      window.location.assign("https://fredlintz5.github.io/performanceManagementChartRipoff/");
    }
  }, error => console.log(error));
}

function signOut() {
  firebase.auth().signOut()
  	.then(() => window.location.assign("https://fredlintz5.github.io/performanceManagementChartRipoff/"))
  	.catch(error => console.log(error));
}

// Fitness (CTL) is a rolling 42 day average of your daily TSS.
// Fatigue (ATL) is a 7 day average of your TSS that accounts for the workouts you have done recently.
// Form (TSB) is the balance of TSS equal to yesterday's fitness minus yesterday's fatigue.


// fetch(`https://performance-management-chart.firebaseio.com/.json`)
//   .then(response => response.json())
//   .then(response => {
// 	let fireBaseData = Object.values(response);

// 	for (var i=0; i < fireBaseData.length; i++){
// 		fetch(`https://performance-management-chart.firebaseio.com/users/8APzI8H9ZdYROAZ8NZzH30GWj492/.json`, {
//         method: 'POST',
//         type: 'JSON',
//         body: `{"date": "${fireBaseData[i].date}","tss": "${fireBaseData[i].tss}"}`
//     })
// 	}
// })