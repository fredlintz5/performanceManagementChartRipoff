let chart = '';
let uid = '';
let photoURL = '';
let visibleDates = window.innerWidth > 700 ? 42 : 14;
let ctx = $('#powerGraph');
let descendingDates = {};
let tempArray = [];
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
			hidden: true,
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
			hidden: true,
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
			hidden: true,
			data: []
		}, {
			type: 'bar',
			label: 'TSS - Projected',
			yAxisID: 'C',
			backgroundColor: 'rgba(253, 101, 133, 0.4)',
			borderColor: 'rgba(253, 101, 133, 0.9)',
			borderWidth: 0.85,
			borderDash: [5,5],
			hidden: true,
			data: []
		} 
		]
	}, 
	options: {
		responsive: true,
		maintainAspectRatio: false,
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
				ticks: {max: 80,min: 0,display: false},
				gridlines: {display: false}
			}, {
				id: 'B',
				type: 'linear',
				position: 'left',
				ticks: {max: 30,min: -30,display: false},
				gridlines: {display: false}
			}, {
				id: 'C',
				type: 'linear',
				position: 'right',
				ticks: {max: 500,min: 0,display: false},
				gridlines: {display: false}
			}],
			xAxes: [{gridLines: {display:false}}]
		}
	} 
};

ctx.height('75vh');

initApp();
createProjectedInputs();

$('#submitActualTSS').on('click', event => {
	event.preventDefault();

	let submittedActualTSS = $("#submittedActualTSS").val();
	let submittedActualDate = $("#submittedActualDate").val();
	let submittedActualIF = $("#submittedActualIF").val();
	if (submittedActualTSS === '' || submittedActualDate === '' || submittedActualIF === '') {return}
	let convertedDate = moment(submittedActualDate).unix();

	postFirebaseData({date:convertedDate,tss:submittedActualTSS,if:submittedActualIF});
	if (chartObject.data.datasets[3].data.length > 0) {
		clearChartData(); 
		chart.destroy();
	}
	getFirebaseData(uid);

	clearModalInputs();
	$('#addTSSModal').modal('hide');
})

$('#submitProjectedTSS').on('click', function() {
	event.preventDefault();

	let inputArray = [];
	let inputs = $('#nav-projected :input').not(':input[type=button]');

	inputs.each((i, value) => inputArray.push({date: $(value).attr('id'), tss: $(value).val()}));
	
	createProjectedChart(inputArray);
	$('#projected').toggleClass('false');
	$('#addTSSModal').modal('hide');
})

$('#submitFTP').on('click', event => {
	event.preventDefault();

	let submittedFTP = $("#submittedFTP").val();
	if (submittedFTP === '') {return};

	postFTPData({date:moment().unix(),ftp:submittedFTP});

	clearModalInputs();
	$('#addTSSModal').modal('hide');
	fillFooterData();
})

$('#legend span').on('click', function() {
	switch ($(this).text()) {
		case 'CTL':
			chartObject.data.datasets[0].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'ATL':
			chartObject.data.datasets[1].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'TSB':
			chartObject.data.datasets[2].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'TSS':
			chartObject.data.datasets[3].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
		case 'Future':
			chartObject.data.datasets[4].hidden = $(this).hasClass('false') ? true : false;
			chartObject.data.datasets[5].hidden = $(this).hasClass('false') ? true : false;
			chartObject.data.datasets[6].hidden = $(this).hasClass('false') ? true : false;
			chartObject.data.datasets[7].hidden = $(this).hasClass('false') ? true : false;
			$(this).toggleClass('false');
			break;
	}
	chart.update();
})

function createActualChart() {
	setActualChartDateLabels();
	calulateGraphData();
	chart = new Chart(ctx, chartObject);
	fillHeaderData();
	fillFooterData();
}

function createProjectedChart(inputArray) {
	setProjectedChartDateLabels(inputArray);
	calulateProjectedGraphData();
	chartObject.data.datasets[3].hidden = true;
	chartObject.data.datasets[4].hidden = false;
	chartObject.data.datasets[5].hidden = false;
	chartObject.data.datasets[6].hidden = false;
	chartObject.data.datasets[7].hidden = false;
	chart.update();
}

function setActualChartDateLabels() {
	let index = 1;

	for (let prop in descendingDates) {
		if (index > parseInt(visibleDates)) { break; } 
		
		chartObject.data.labels.unshift(prop);
		chartObject.data.datasets[3].data.unshift(descendingDates[prop]);
		chartObject.data.datasets[7].data.unshift(descendingDates[prop]);
		
		index++;
	}
}

function setProjectedChartDateLabels(inputArray) {
	$.each(inputArray, (index,value) => {
		chartObject.data.labels.push(value.date);
		chartObject.data.datasets[7].data.push(parseInt(value.tss));
		tempArray.unshift(parseInt(value.tss));
	})
}

function calulateGraphData() {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;
	let tssArray = Object.values(descendingDates);
	let arrayLength = tssArray.length;
	tempArray = Object.values(descendingDates);

	for (var i = 0; i < visibleDates; i++) {
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

function calulateProjectedGraphData() {
	let ctlTSS, atlTSS, CTL, ATL, TSB, tss;
	let arrayLength = visibleDates + 14;
	
	for (var i = 0; i < arrayLength; i++) {
		ctlTSS = 0;
		atlTSS = 0;

		for (var j = 0; j < tempArray.length; j++) {
			tss = parseInt(tempArray[j]);

			if (j === 42) {
				break;
			} else {
				ctlTSS += tss;
				if (j < 7) {
					atlTSS += tss;
				}
			} 
		}
		tempArray.shift();

		CTL = (ctlTSS/42).toFixed(2);
		ATL = (atlTSS/7).toFixed(2);
		TSB = (CTL - ATL).toFixed(2);
		
		chartObject.data.datasets[4].data.unshift(CTL);
		chartObject.data.datasets[5].data.unshift(ATL);
		chartObject.data.datasets[6].data.unshift(TSB);
	}	
}

function getFirebaseData(uid) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/actual/.json`)
		.then(response => response.json())
		.then(response => {

			if (response === null) {
				alert('Add some data to get Chart to Display');
				return;
			} else {
				let compareDate = '';
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

				createActualChart(descendingDates);
			}
		})
}

function postFirebaseData(object) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/actual/.json`, {
		method: 'POST',
		type: 'JSON',
		body: `{"date": "${object.date}","tss": "${object.tss}","if": "${object.if}"}`
	})
}

function getFTPData() {
	let date = 0;
	let ftp = 0;

	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/ftp/.json`)
		.then(response => response.json())
		.then(response => {
			if (response === null) {
				alert('Add some FTP data!');
				return;
			} else {

				Object.values(response).forEach((val, i) => {
					if (parseInt(val.date) > date) {
						ftp = parseInt(val.ftp);
					}
				})
			}
			$('#currentFTP .statData').empty().text(ftp);
		})
}

function postFTPData(object) {
	fetch(`https://performance-management-chart.firebaseio.com/users/${uid}/ftp/.json`, {
		method: 'POST',
		type: 'JSON',
		body: `{"date": "${object.date}","ftp": "${object.ftp}"}`
	})
}

function initApp() {
	firebase.auth().onAuthStateChanged(user => {
		if (user) {
			uid = user.uid;
			photoURL = user.photoURL;
			getFirebaseData(uid);
			$('#welcome').html(`<image src=${photoURL} title="Log Out" onclick="signOut()"/>`);
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

function clearChartData() {
	chartObject.data.labels = [];
	$.each(chartObject.data.datasets, (index, value) => {
		value.data = [];
		value.hidden = false;
	});
}

function createProjectedInputs() {
	let startDate = moment().unix();;

	for (var i = 14; i > 0; i--) {
		let newDate = moment.unix(startDate).add(i, 'days').format('M/DD');
		let inputRow = `
			<div class="form-group row">
				<label for="${newDate}" class="col-sm-3 col-form-label">${newDate}</label>
				<div class="col-sm-9">
					<input class="form-control" id="${newDate}" type="numeric" value="0">
				</div>
			</div>`;

		$('#nav-projected').prepend(inputRow);
	}
}

function clearModalInputs() {
	$('#addTSSModal :input').val('');
}

function fillHeaderData() {
	let ctl = parseInt(chartObject.data.datasets[0].data[chartObject.data.datasets[0].data.length - 1]).toFixed();
	let atl = parseInt(chartObject.data.datasets[1].data[chartObject.data.datasets[1].data.length - 1]).toFixed();
	let tsb = parseInt(chartObject.data.datasets[2].data[chartObject.data.datasets[2].data.length - 1]).toFixed();
	let ctlInterval = setInterval(ctlIncrementer, 20);
	let atlInterval = setInterval(atlIncrementer, 15);
	let tsbInterval = setInterval(tsbIncrementer, 40);
	let ctlIndex = 0;
	let atlIndex = 0;
	let tsbIndex = 0;

	function ctlIncrementer() {
		if (ctlIndex <= ctl) {
			$('#fitnessHead span').text(ctlIndex);
			ctlIndex++
		} else {
			clearInterval(ctlInterval);
		}
	}

	function atlIncrementer() {
		if (atlIndex <= atl) {
			$('#fatigueHead span').text(atlIndex);
			atlIndex++
		} else {
			clearInterval(atlInterval);
		}
	}

	function tsbIncrementer() {
		if (tsb < 0) {
			if (tsbIndex >= tsb) {
				$('#stressHead span').text(tsbIndex);
				tsbIndex--;
			} else {
				clearInterval(tsbInterval);
			}
		} else {
			if (tsbIndex <= tsb) {
				$('#stressHead span').text(tsbIndex);
				tsbIndex++
			} else {
				clearInterval(tsbInterval);
			}
		}
	}
}

function fillFooterData() {
	let tssArray = chartObject.data.datasets[3].data;

	$('#fourteenDay .statData')
		.empty()
		.text(tssArray.slice((tssArray.length - 14), tssArray.length).reduce((a, b) => a + b, 0));

	$('#sevenDay .statData')
		.empty()
		.text(tssArray.slice((tssArray.length - 7), tssArray.length).reduce((a, b) => a + b, 0));

	getFTPData();
}

// Fitness (CTL) is a rolling 42 day average of your daily TSS.
// Fatigue (ATL) is a 7 day average of your TSS that accounts for the workouts you have done recently.
// Form (TSB) is the balance of TSS equal to yesterday's fitness minus yesterday's fatigue.
