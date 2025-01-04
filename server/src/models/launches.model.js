
const axios = require('axios');

const launchesDB = require('./launches.mongo.js');
const planets = require('./planets.mongo.js')

//const launches = new Map();

const LATEST_FLIGHT_NUMBER = 100;
//let latesFlightNumber = 0;

/*
const launch = {
    flightNumber: 0,
    mission: 'm',
    rocket: 'r',
    launchDate: new Date(),
    target: 'd',
    customers: ['c'],
    upcoming: true,
    success: true
}
*/

//saveLaunch(launch)

//launches.set(launch.flightNumber, launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches(){
    console.log('Download launch data...')
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }
    },
    {
        headers: {'Accept-Encoding': 'text/html; charset=UTF-8'}
    });

    if(response.status !== 200){
        console.log('Problem downloading launch data')
    }

    const launchDocs = response.data.docs;
    for(const launchDoc of launchDocs){
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => payload['customers']);

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            customers,
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success']
        }
        console.log(`${launch.flightNumber} ${launch.mission}`)
        
        await saveLaunch(launch)
    }

}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1
    })

    if(firstLaunch) {
        console.log('Launch data already loaded!')
        return;
    } else {
        await populateLaunches();
    }

}

async function findLaunch(filter){
    return await launchesDB.findOne(filter)
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId
    })
    //return launches.has(launchId)
}

async function getLatestFlightNumber(){
    const latesLaunch = await launchesDB
        .findOne()
        .sort('-flightNumber')
    
    return latesLaunch 
        ? latesLaunch.flightNumber
        : LATEST_FLIGHT_NUMBER
}

async function getAllLaunches(skip, limit) {
    //return Array.from(launches.values());
    
    return await launchesDB
        .find({}, {'_id': 0, '__v': 0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit);
}



async function saveLaunch(launch) {
    await launchesDB.findOneAndUpdate({
        flightNumber: launch.flightNumber, 
    }, 
    launch, 
    {
        upsert: true
    })
}

async function scheduleNewLaunch(launch){
    const planet = await planets.findOne({
        keplerName: launch.target
    })

    if(!planet){
        throw new Error('No matching planet was found!')
    }

    const newFlightNumber = await getLatestFlightNumber() + 1
    const newLaunch = Object.assign(launch, {
        customers: ['ZTM', 'NASA'],
        flightNumber: newFlightNumber,
        upcoming: true,
        success: true
    })

    await saveLaunch(newLaunch)
}
/*
function addNewLaunch(launch){
    latesFlightNumber++;
    launches.set(latesFlightNumber, Object.assign(launch, {
        customers: ['ZTM', 'NASA'],
        flightNumber: latesFlightNumber,
        upcoming: true,
        success: true
    }));    
}
*/

async function abortLaunchById(launchId) {
    const aborted =  await launchesDB.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success: false
    })

    //return aborted.ok === 1 && aborted.nModified === 1;
    return aborted.modifiedCount === 1 && aborted.acknowledged === true && aborted.matchedCount === 1;
    /*
    const aborted = launches.get(launchId);
    aborted.upcoming = false;
    aborted.success = false;
    return aborted;
    */
    //launches.delete(launchId);
}

module.exports = {
    loadLaunchData,
    getAllLaunches,
    //addNewLaunch,
    existsLaunchWithId,
    abortLaunchById,
    scheduleNewLaunch
}