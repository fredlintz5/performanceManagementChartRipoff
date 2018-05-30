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

let chart = '';
let uid = '';
let userEmail = '';
let visibleDates = 42;
let ctx = $('#powerGraph');
let chartObject = {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
    		type: 'line',
        label: "CTL",
        lineTension: 0,
        yAxisID: 'A',
        backgroundColor: 'rgba(100,146,182, 0.2)',
        borderColor: 'rgb(100,146,182, 0.9)',
        borderWidth: 0.85,
        hidden: false,
        data: []
    }, {
    		type: 'line',
        label: "ATL",
        lineTension: 0,
        yAxisID: 'A',
        fill: false,
        backgroundColor: 'rgba(242,140,222, 0.9)',
        borderColor: 'rgba(242,140,222, 0.9)',
        borderWidth: 0.85,
        hidden: false,
        data: []
    }, {
    		type: 'line',
        label: "TSB",
        lineTension: 0,
        yAxisID: 'B',
        fill: false,
        backgroundColor: 'rgba(246,192,119, 0.9)',
        borderColor: 'rgba(246,192,119, 0.9)',
        borderWidth: 0.85,
        hidden: false,
        data: []
    }, {
    		type: 'bar',
        label: 'TSS',
        yAxisID: 'C',
        backgroundColor: 'rgba(253, 101, 133, 0.9)',
      	borderColor: 'rgba(253, 101, 133, 0.9)',
      	borderWidth: 0.85,
      	hidden: false,
        data: []
    },{
    		type: 'line',
        label: "CTL - Projected",
        lineTension: 0,
        yAxisID: 'A',
        fill: false,
        backgroundColor: 'rgba(100,146,182, 0.2)',
        borderColor: 'rgb(100,146,182, 0.9)',
        borderWidth: 0.85,
        borderDash: [5,5],
        hidden: false,
        data: []
    }, {
    		type: 'line',
        label: "ATL - Projected",
        lineTension: 0,
        yAxisID: 'A',
        fill: false,
        backgroundColor: 'rgba(242,140,222, 0.9)',
        borderColor: 'rgba(242,140,222, 0.9)',
        borderWidth: 0.85,
        borderDash: [5,5],
        hidden: false,
        data: []
    }, {
    		type: 'line',
        label: "TSB - Projected",
        lineTension: 0,
        yAxisID: 'B',
        fill: false,
        backgroundColor: 'rgba(246,192,119, 0.9)',
        borderColor: 'rgba(246,192,119, 0.9)',
        borderWidth: 0.85,
        borderDash: [5,5],
        hidden: false,
        data: []
    }, {
    		type: 'bar',
        label: 'TSS - Projected',
        yAxisID: 'C',
        backgroundColor: 'rgba(253, 101, 133, 0.4)',
      	borderColor: 'rgba(253, 101, 133, 0.9)',
      	borderWidth: 0.85,
      	borderDash: [5,5],
      	hidden: false,
        data: []
    } 
    ]
  }, 
  options: {
  	legend: {display: false},
  	tooltips: {
			mode: 'index',
			intersect: true,
			callbacks: {
        label: (tooltipItem, data) => {
        	let label = data.datasets[tooltipItem.datasetIndex].label || '';

          if (label) {label += ': ';}
          label += tooltipItem.yLabel;
          return label;
        } 
      }
		},
  	scales: {
      yAxes: [{
        id: 'A',
        type: 'linear',
        position: 'right',
        ticks: {max: 80,min: 0},
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
        ticks: {max: 500,min: 0},
        gridlines: {display: false}
      }, {
      	stacked: true
      }],
      xAxes: [{gridLines: {display:false}}, {stacked: true}],
    }
  } 
};

initApp()

$('#submitActualTSS').on('click', event => {
	event.preventDefault();

	let submittedActualTSS = $("#submittedActualTSS").val();
	let submittedActualDate = $("#submittedActualDate").val();
	let submittedActualIF = $("#submittedActualIF").val();
	let convertedDate = moment(submittedActualDate).unix();

	postFirebaseData({date:convertedDate,tss:submittedActualTSS,if:submittedActualIF}, 'actual');
	if (chartObject.data.datasets[3].data.length > 0) {
		clearData(); 
		chart.destroy();
	}
	getActualFirebaseData(uid);
	getProjectedFirebaseData(uid);

	$('#submittedActualTSS').val('');
	$('#submittedActualDate').val('');
	$('#submittedActualIF').val('');
	$('#addTSSModal').modal('hide');
})

$('#submitProjectedTSS').on('click', event => {
	event.preventDefault();

	let submittedProjectedTSS = $("#submittedProjectedTSS").val();
	let submittedProjectedDate = $("#submittedProjectedDate").val();
	let convertedDate = moment(submittedProjectedDate).unix();

	postFirebaseData({date:convertedDate,tss:submittedProjectedTSS,if:'0'}, 'projected');
	if (chartObject.data.datasets[3].data.length > 0) {
		clearData(); 
		chart.destroy();
	}
	getActualFirebaseData(uid);
	getProjectedFirebaseData(uid);

	$('#submittedProjectedTSS').val('');
	$('#submittedProjectedDate').val('');
	$('#addTSSModal').modal('hide');
})

$('#legend button').on('click', function() {
	switch ($(this).text()) {
		case 'Fitness (CTL)':
			chartObject.data.datasets[0].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'Fatigue (ATL)':
			chartObject.data.datasets[1].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'Form (TSB)':
			chartObject.data.datasets[2].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'Daily TSS':
			chartObject.data.datasets[3].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
	}
	chart.update();
})

function createActualChart(days, data) {
	setActualChartDateLabels(days, data);
	calulateGraphData(days, data, 'actual');
	chart = new Chart(ctx, chartObject);
}

function createProjectedChart(days, firebaseData, chartObject) {
	setProjectedChartDateLabels(firebaseData);
	calulateProjectedGraphData(days, chartObject);
}

function setActualChartDateLabels(days, data) {
	let index = 1;

	for (let prop in data) {
		if (index > parseInt(days)) {
			break;
		} 
		
		chartObject.data.labels.unshift(prop);
		chartObject.data.datasets[3].data.unshift(data[prop]);
		chartObject.data.datasets[7].data.unshift(data[prop]);
		
		index++;
	}
}

function setProjectedChartDateLabels(data) {
	let index = data.length;

	for (let prop in data) {
		if (index < 1) {
			break;
		} 
		
		chartObject.data.labels.push(prop);
		chartObject.data.datasets[7].data.push(data[prop]);
		
		index--;
	}
}

function calulateGraphData(days, data) {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;
	let tssArray = Object.values(data);
	let arrayLength = tssArray.length;

	for (var i = 0; i < days; i++) {
		ctlTSS = 0;
		atlTSS = 0;

		for (var j = 0; arrayLength; j++) {
			tss = parseInt(tssArray[j]);

			if (j === 42) {
				break;
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

function calulateProjectedGraphData(days, chartObject) {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;
	let projectedTSSArray = chartObject.data.datasets[7].data;
	let arrayLength = projectedTSSArray.length;


	for (var i = 0; i < days + 14; i++) {
		ctlTSS = 0;
		atlTSS = 0;

		for (var j = 0; j < arrayLength; j++) {
			tss = parseInt(projectedTSSArray[j]);

			if (j === 42) {
				break;
			} else {
				ctlTSS += tss;
				if (j < 7) {
					atlTSS += tss;
				}
			} 
		}
		projectedTSSArray.shift();

		CTL = (ctlTSS/42).toFixed(2);
		ATL = (atlTSS/7).toFixed(2);
		TSB = (CTL - ATL).toFixed(2);
		
		chartObject.data.datasets[4].data.unshift(CTL);
		chartObject.data.datasets[5].data.unshift(ATL);
		chartObject.data.datasets[6].data.unshift(TSB);
	}	
}

function getActualFirebaseData(uid) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/actual/.json`)
		.then(response => response.json())
		.then(response => {

			if (response === null) {
				alert('Add some data to get Chart to Display');
				return;
			} else {
				let compareDate = '';
				let descendingDates = {};
				let startDate = moment().unix();
				let responseValues = Object.values(response);
				let arrayLength = responseValues.length;
				
				for (var i = 0; i < 120; i++) {
					descendingDates[moment.unix(startDate).subtract(i, 'days').format('M/DD')] = 0;
				}

				for (var j = 0; j < arrayLength; j++) {
					tss = (responseValues[j].tss !== undefined) ? parseInt(responseValues[j].tss) : 0;
					compareDate = moment.unix(responseValues[j].date).format('M/DD');
					descendingDates[compareDate] += tss;
				}

				createActualChart(visibleDates, descendingDates);
			}
		})
}

function getProjectedFirebaseData(uid) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/projected/.json`)
		.then(response => response.json())
		.then(response => {

			if (response === null) {
				alert('Add some Projected data to get lines to Display');
				return;
			} else {
				let compareDate = '';
				let ascendingDates = {};
				let startDate = moment().unix();
				let responseValues = Object.values(response);
				let arrayLength = responseValues.length;
				
				for (var i = 1; i < 14; i++) {
					ascendingDates[moment.unix(startDate).add(i, 'days').format('M/DD')] = 0;
				}

				for (var j = 0; j < arrayLength; j++) {
					tss = (responseValues[j].tss !== undefined) ? parseInt(responseValues[j].tss) : 0;
					compareDate = moment.unix(responseValues[j].date).format('M/DD');
					ascendingDates[compareDate] += tss;
				}

				createProjectedChart(visbibleDates, ascendingDates, chartObject);
			}
		})
}

function postFirebaseData(object, whereTo) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/${whereTo}/.json`, {
		method: 'POST',
		type: 'JSON',
		body: `{"date": "${object.date}","tss": "${object.tss}","if": "${object.if}"}`
	})
}

function initApp() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      uid = user.uid;
     	userEmail = user.email;
      getActualFirebaseData(uid);
      getProjectedFirebaseData(uid);
      $('#welcome').prepend(`<span style="color: #6C757C;">${userEmail}</span>`);
    } else {
      window.location.assign('https://fredlintz5.github.io/performanceManagementChartRipoff/');
    }
  }, error => console.log(error));
}

function signOut() {
  firebase.auth().signOut()
  	.then(() => window.location.assign('https://fredlintz5.github.io/performanceManagementChartRipoff/'))
  	.catch(error => console.log(error));
}

function clearData() {
	chartObject.data.labels = [];
	chartObject.data.datasets[0].data = [];
	chartObject.data.datasets[1].data = [];
	chartObject.data.datasets[2].data = [];
	chartObject.data.datasets[3].data = [];
	chartObject.data.datasets[4].data = [];
	chartObject.data.datasets[5].data = [];
	chartObject.data.datasets[6].data = [];
	chartObject.data.datasets[7].data = [];
	chartObject.data.datasets[0].hidden = false;
	chartObject.data.datasets[1].hidden = false;
	chartObject.data.datasets[2].hidden = false;
	chartObject.data.datasets[3].hidden = false;
	chartObject.data.datasets[4].hidden = false;
	chartObject.data.datasets[5].hidden = false;
	chartObject.data.datasets[6].hidden = false;
	chartObject.data.datasets[7].hidden = false;
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