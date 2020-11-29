const client = FHIR.client("https://apps.hdap.gatech.edu/hapiR4/baseR4/");

var query = new URLSearchParams();
var test_name = [["jlu348_patient_1", "cs6440"], ["jlu348_patient_2","cs6440"]];

console.log("Test names : " + test_name);
var init_heart_rate = {
    code : "8867-4",
    text : "Heart rate",
    unit : "beats/minute",
    value : 44
};

var init_diastolic_blood_pressure = {
    code : "8462-4",
    text : "Dystolic Pressure",
    unit : "mm[Hg]",
    value : 80
};

var init_systolic_blood_pressure = {
    code : "8480-6",
    text : "Systolic Pressure",
    unit : "mm[Hg]",
    value : 150
};

var init_respiratory_rate = {
    code : "9279-1",
    text : "Respiratory rate",
    unit : "breaths/minute",
    value : 20
};

var init_temperature = {
    code : "8310-5",
    text : "Temperature",
    unit : "F",
    value : 99
};

var reset_patients = true;
console.log("Checking if patients exits in FHIR");
for (i = 0; i < test_name.length; i++) {
    patient_name = test_name[i];
    init_test_patients(patient_name);
};
console.log("Complete");
function init_test_patients(patient_name) {
    console.log("Processing patient: " + patient_name);
    var given_name = patient_name[0];
    var family_name = patient_name[1];
    query.set("given", given_name);
    client.request("Patient?" + query, {
        pageLimit: 0,
        flat: true
    }).then(
        function (response) {
            if (response.length === 0) {
                console.log("Did not find the patient: " + given_name);
                console.log("Creating new patient: " + given_name);
                create_new_patient(given_name,family_name);
                console.log("Checking patient observation data.")
                //var ob = generate_vital_sign_observation_json(heart_rate, patient_id);
                //create_vital_observation(ob);
                get_patient_observation(patient_id);
            } else {
                console.log("Found patient: " + patient_name);
                console.log(response);
                for (i = 0; i < response.length; i++) {
                    var patient_id = response[i].id;
                    if (reset_patients) {
                        console.log("Deleted patient and observation data.");
                        delete_patient_observations(patient_id);
                        delete_patient(patient_id);
                    } else {
                        console.log("Checking patient observation data.")
                        get_patient_observation(patient_id);
                    }
                }
            }
        }
    );
};

function delete_patient(patient_id) {
    client.delete(`Patient/${patient_id}`).then(
        function(response) {
            console.log(response.issue);
        }
    );

};

function create_new_patient(given_name, family_name) {
    const patient_json = {
        "resourceType": "Patient",
        "name": [ {
            "family": family_name,
            "given": given_name,
        } ]
    };

    client.create(patient_json).then(
        function(response) {
            console.log(response.issue);
        }
    );
};
function delete_patient_observations(patient_id) {
    var query = new URLSearchParams();

    query.set("patient", patient_id);
    query.set("_count", 100);
    query.set("_sort", "-date");
    query.set("code", [
        'http://loinc.org|8867-4',
        'http://loinc.org|8462-4',
        'http://loinc.org|8480-6',
        'http://loinc.org|9279-1',
        'http://loinc.org|8310-5',
    ].join(","));

    client.request("Observation?" + query, {
        pageLimit: 0,
        flat: true
    }).then(
        function(response) {
            console.log("Observation - patient ID: " + patient_id);
            console.log("Deleting...");

            for (i = 0; i < response.length; i++) {
                var ob_id = response[i].id;
                client.delete(`Observation/${ob_id}`).then(
                    function(response) {
                        console.log(response.issue);
                    }
                );
            }

        }
    );
}
function get_patient_observation(patient_id) {
    var query = new URLSearchParams();

    query.set("patient", patient_id);
    query.set("_count", 100);
    query.set("_sort", "-date");
    query.set("code", [
        'http://loinc.org|8867-4',
        'http://loinc.org|8462-4',
        'http://loinc.org|8480-6',
        'http://loinc.org|9279-1',
        'http://loinc.org|8310-5',
    ].join(","));

    client.request("Observation?" + query, {
        pageLimit: 0,
        flat: true
    }).then(
        function(response) {
            console.log("Observation - " + patient_id);
            if (response.length === 0) {
                console.log("Create new observation:")
                var heart_ob = generate_vital_sign_observation_json(init_heart_rate, patient_id);
                var respiratory_ob = generate_vital_sign_observation_json(init_respiratory_rate, patient_id);
                var temperature_ob = generate_vital_sign_observation_json(init_temperature, patient_id);
                var d_blood_pressure_ob = generate_vital_sign_observation_json(init_diastolic_blood_pressure, patient_id);
                var s_blood_pressure_ob = generate_vital_sign_observation_json(init_systolic_blood_pressure, patient_id);
                console.log("ob - heart rate")
                create_vital_observation(heart_ob);
                console.log("ob - respiratory")
                create_vital_observation(respiratory_ob);
                console.log("ob - temperature")
                create_vital_observation(temperature_ob);
                console.log("ob - Dystolic Pressure")
                create_vital_observation(d_blood_pressure_ob);
                console.log("ob - Systolic Pressure")
                create_vital_observation(s_blood_pressure_ob);
            } else {
                console.log("Found " + response.length + " observations:")
                console.log(response);
            }
        }
    );
};

function create_vital_observation(ob) {
   client.create(ob).then(
        function(ob) {
            console.log(ob);
        }
    );
}

function generate_vital_sign_observation_json(data, patient_id) {
    var time = new Date().toISOString();
    const observation_json = {
        resourceType : 'Observation',
        category : [
            {
                coding : [
                    {
                        system : 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code : 'vital-signs',
                        display : 'Vital Signs',
                    },
                ],
                text : 'Vital Signs',
            },
        ],
        code : {
            coding : [
                {
                    system : 'http://loinc.org',
                    code : data.code,
                    display : data.text,
                },
            ],
            text : data.text,
        },
        subject: {
            reference: `Patient/${patient_id}`,
        },
        effectiveDateTime: time,
        valueQuantity : {
            value : data.value,
            unit : data.unit,
            system: "https://unitsofmeasure.org"
        },
    };
    return observation_json;
};