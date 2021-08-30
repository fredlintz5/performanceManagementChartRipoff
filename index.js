const csvFilePath = 'fredTest2.csv'
const csv = require('csvtojson')
const _get = require('lodash.get')

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

function getCorrectFuckingValue(map, keys, label) {
  try {
    return map[`Value ${keys.find(k => map[k] === label).split(' ')[1]}`]
  } catch(e) {
    return ''
  }
}

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

csv()
.fromFile(csvFilePath)
.then((rows) => {
  const semiCircleConversion = 180 / 2 ** 31
  
  const startTime = Date.now()
  
  const records = rows
    .filter(row => row.Type === 'Data' && row.Message === 'record')
    .map(r => {
      const keys = Object.keys(r)

      return {
        // timestamp in milliseconds
        timestamp: getCorrectFuckingValue(r, keys, 'timestamp') * 1000,
        latitude: getCorrectFuckingValue(r, keys, 'position_lat') * semiCircleConversion,
        longitude: getCorrectFuckingValue(r, keys, 'position_long') * semiCircleConversion,
        // distance in meters/s
        distance: Number(getCorrectFuckingValue(r, keys, 'distance')),
        // altitude in meters
        altitude: Number(Number(getCorrectFuckingValue(r, keys, 'altitude')).toFixed()),
        // heart_rate in beats per minute
        heart_rate: Number(getCorrectFuckingValue(r, keys, 'heart_rate')),
        // calories in kilocalories
        calories: Number(getCorrectFuckingValue(r, keys, 'calories')),
        // cadence in rpm
        cadence: Number(getCorrectFuckingValue(r, keys, 'cadence')),
        // speed in meters/s
        speed: Number(getCorrectFuckingValue(r, keys, 'speed')),
        // power in watts
        power: Number(getCorrectFuckingValue(r, keys, 'power')),
        // temperature in celsius
        temperature: Number(getCorrectFuckingValue(r, keys, 'temperature')),
      }
    });

  // calculate Normalized Power
  const rolling_averages_raised_to_fourth_power = records.map((_, i) => (i > 29
    // get previous 30 days worth of power and average them, then raise to 4th power
    ? (records.slice(i - 30, i).reduce((acc, { power }) => acc + power, 0) / 30) ** 4
    : 0
  ))

  const averaged_rolling_averages = rolling_averages_raised_to_fourth_power.reduce((acc, val) => acc + val, 0) / rolling_averages_raised_to_fourth_power.length
  const normalized_power = Number((averaged_rolling_averages ** 0.25).toFixed())

  // calculate more power data
  const intensity_factor = Number((normalized_power / functional_threshold_power).toFixed(2))
  const training_stress_score = Number(((records.length * normalized_power * intensity_factor) / (functional_threshold_power * 36)).toFixed())
  
  // basic workout data
  const distance = Number((records[records.length - 1].distance).toFixed(2))
  const duration = records.length * 1000
  
  // total stats
  const recordsLength = records.length
  const finalIndex = recordsLength - 1

  let stats = records.reduce((acc, { power, heart_rate, cadence, speed, altitude, temperature }, index) => ({
    ...acc,
    ...minAvgMaxCalculations(acc, { power, heart_rate, cadence, speed, altitude, temperature }, index, finalIndex, recordsLength)
  }), {})

  const workout_data = {
    distance,
    duration,
    functional_threshold_power,
    normalized_power,
    intensity_factor,
    training_stress_score,
    stats,
  }
  
  const endTime = Date.now()
  
  console.log('workout_data', JSON.stringify(workout_data, null, 2))
  console.log(`${recordsLength} records in ${endTime - startTime} milliseconds`);
})
