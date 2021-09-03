// const csvFilePath = 'fredLapTest.csv'
// const csvFilePath = 'fredTest2.csv'
// const csv = require('csvtojson')
const _get = require('lodash.get')
const fitDecoder = require('fit-decoder');
const fs = require('fs');
const { parseRecords } = require('./fitDecoder/semantics');

const functional_threshold_power = 240
const maxInteger = Number.MAX_SAFE_INTEGER

/* Calc-a-lations
 * https://medium.com/critical-powers/formulas-from-training-and-racing-with-a-power-meter-2a295c661b46
 * Normalized Power = {
    rolling_average = 30 second rolling average
    rolling_avg_powered = rolling_average^4
    avg_powered_values = average of rolling_avg_powered
 * } = avg_powered_values^0.25
 * Intensity Factor = NP / FTP
 * TSS = (durationOfWorkoutInSeconds * NP * IF) / (FTP * 36)
*/

fs.readFile('./fredLapTest.fit', (err, data) => {
  const startTime = Date.now()
  
  const jsonRaw = fitDecoder.fit2json(data.buffer);

  /*
    data: {
      ascent: 18,
      grade: -391,
      gps_accuracy: 2,
      latitude: 39.73923,
      longitude: -105.204762,
      timestamp: 998955723000, (ms)
      cadence: 84,             (rpm)
      power: 154,              (watts)
      altitude: 11399,         (meters)
      temperature: 25,         (celsius)
      speed: 6.11,             (meters/s)
      distance: 107233,        (meters/s)
      left_right_balance: 46,  (percentage)
      calories: 36,            (kilocalories)
      heart_rate: 136,         (beats per minute)
    },
    type: 'record',
  */
  const jsonParsed = parseRecords(jsonRaw);
  
  let nestedArray = []

  /*
   * chunked records shape: array of laps. each lap is an array of records
   * [
   *   [{}, {}, {}, {}, {}]
   *   [{}, {}, {}, {}, {}]
   * ]
  */
  const chunkedRecords = jsonParsed.records
    .filter(row => ['record', 'lap'].includes(row.type))
    .reduce((acc, { type, data }) => {
      if (type === 'lap') {
        const accumulatorPlusNestedArray = acc.length ? [...acc, nestedArray] : [nestedArray]
        nestedArray = []
        return accumulatorPlusNestedArray
      }
      
      nestedArray.push(data)
      return acc
    }, []);

  const per_lap_workout_data = chunkedRecords.reduce((acc, lap, index) => ({ ...acc, [`Lap ${index + 1}`]: getWorkoutData(lap) }), {})

  const total_workout_data = getWorkoutData(chunkedRecords.reduce((acc, lap, index) => index === 0 ? [...acc, ...lap] : [...lap], []))

  const endTime = Date.now()

  console.log('per_lap_workout_data', JSON.stringify(per_lap_workout_data, null, 2))
  console.log('total_workout_data', JSON.stringify(total_workout_data, null, 2))
  console.log(`${total_workout_data.length} records in ${endTime - startTime} milliseconds`);
})


function minAvgMaxCalculations(accumulator, fields, currentIndex, finalIndex, recordsLength) {
  return Object.keys(fields).reduce((acc, field) => {
    return {
      ...acc,
      [field]: {
        min: _get(accumulator, `${field}.min`, maxInteger) < fields[field] ? accumulator[field].min : fields[field],
        avg: currentIndex === finalIndex ? (accumulator[field].avg + fields[field]) / recordsLength : (_get(accumulator, `${field}.avg`, 0) + fields[field]),
        max: _get(accumulator, `${field}.max`, 0) > fields[field] ? accumulator[field].max : fields[field],
      },
    }
  }, {})
}

function getWorkoutData(records) {
  // calculate Normalized Power
  const rolling_averages_raised_to_fourth_power = records.map((_, i) => (i > 29
    // get previous 30 days worth of power and average them, then raise to 4th power
    ? (records.slice(i - 30, i).reduce((acc, { power = 0 }) => acc + power, 0) / 30) ** 4
    : 0
  ))
  
  const averaged_rolling_averages = rolling_averages_raised_to_fourth_power.reduce((acc, val) => acc + val, 0) / rolling_averages_raised_to_fourth_power.length
  const normalized_power = Number((averaged_rolling_averages ** 0.25).toFixed())

  // calculate more power data
  const intensity_factor = Number((normalized_power / functional_threshold_power).toFixed(2))
  const training_stress_score = Number(((records.length * normalized_power * intensity_factor) / (functional_threshold_power * 36)).toFixed())
  
  // basic workout data
  const distance = Number((_get(records, `${[records.length - 1]}.distance`, 0)).toFixed(2))
  const duration = records.length * 1000
  
  // total stats
  const recordsLength = records.length
  const finalIndex = recordsLength - 1

  let stats = records.reduce((acc, { power = 0, heart_rate = 0, cadence = 0, speed = 0, altitude = 0, temperature = 0 }, index) => ({
    ...acc,
    ...minAvgMaxCalculations(acc, { power, heart_rate, cadence, speed, altitude, temperature }, index, finalIndex, recordsLength)
  }), {})

  return {
    distance,
    duration,
    functional_threshold_power,
    normalized_power,
    intensity_factor,
    training_stress_score,
    stats,
  }
}
