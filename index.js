const {
  parseFitFile,
  getAllFlattenedRecords,
  getChunkedLapRecords,
  getPerLapWorkoutDataFromChunks,
  getTotalWorkoutDataFromChunks,
} = require('./services/FitConverter')

const fitFilePath = './services/fredLapTest.fit'

async function init() {
  parseFitFile(fitFilePath, (records) => {
    const flattened_data = getAllFlattenedRecords(records)

    const chunked_records = getChunkedLapRecords(records)
    const per_lap_workout_data = getPerLapWorkoutDataFromChunks(chunked_records)
    const total_workout_data = getTotalWorkoutDataFromChunks(chunked_records)

    // firestore
    // records -> docId = <user_id>-<workout_id> -> flattened_data
    // users -> docId = auth_user_id -> { email, hr, power, etc }
    // workouts -> docId = autoGenerated -> { created_dt, updated_dt, calendar_dt, total_workout_data, stats }

    // function getCalanderDate(timestamp) -> for workouts object
    // const d = new Date(Date.now());
    // const year = d.getUTCFullYear();
    // const month = d.getUTCMonth();
    // const day = d.getUTCDate();
    // // set time to begin day UTC
    // const startTime = Date.UTC(year, month, day, 0, 0, 0, 0);
  })
}

init();
