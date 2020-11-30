function initialize_fhir_data(reset_patients, fhir_servre) {
    document.getElementById("Output").innerHTML = "";
//const client = FHIR.client("https://apps.hdap.gatech.edu/hapiR4/baseR4/");
    var fhir_server = "http://hapi.fhir.org/baseR4/"
    const client = FHIR.client(fhir_server);
    var test_name = [["jlu348_male_patient", "cs6440", "1988-02-12", "male"], ["jlu348_female_patient", "cs6440", "1992-04-22", "female"]];
    var query = new URLSearchParams();
    var html_output = "FHIR server: " + fhir_server + "\n";
    html_output += "\n";
    console.log("Test names : " + test_name);
    html_output += "Patient name: \n";
    for (i = 0; i < test_name.length; i++) {
        html_output += i + "-> " + test_name[i][1] + ", " + test_name[i][0] + "\n";
    }
    var init_heart_rate = {
        code: "8867-4",
        text: "Heart rate",
        unit: "beats/minute",
        value: 70
    };

    var init_diastolic_blood_pressure = {
        code: "8462-4",
        text: "Dystolic Pressure",
        unit: "mm[Hg]",
        value: 80
    };

    var init_systolic_blood_pressure = {
        code: "8480-6",
        text: "Systolic Pressure",
        unit: "mm[Hg]",
        value: 150
    };

    var init_respiratory_rate = {
        code: "9279-1",
        text: "Respiratory rate",
        unit: "breaths/minute",
        value: 20
    };

    var init_temperature = {
        code: "8310-5",
        text: "Temperature",
        unit: "F",
        value: 99.5
    };

    var init_oxygen_level = {
        code: "20564-1",
        text: "Oxygen Saturation",
        unit: "percent",
        value: 98
    };

    console.log("Checking if patients exits in FHIR");
    html_output += "\nChecking if patients exits in FHIR...\n"
    for (i = 0; i < test_name.length; i++) {
        patient_name = test_name[i];
        init_test_patients(patient_name);
    }
    console.log("Complete");

    function init_test_patients(patient_name) {
        console.log("Processing patient: " + patient_name);
        var given_name = patient_name[0];
        var family_name = patient_name[1];
        var dob = patient_name[2];
        var gender = patient_name[3];
        query.set("given", given_name);
        client.request("Patient?" + query, {
            pageLimit: 0,
            flat: true
        }).then(
            function (response) {
                if (response.length === 0) {
                    console.log("Did not find the patient: " + given_name);
                    html_output += "Did not find the patient: " + given_name + "\n";
                    if (reset_patients === "false") {
                        console.log("Creating new patient: " + given_name);
                        create_new_patient(given_name, family_name,dob, gender);
                        html_output += "Creating new patient: " + given_name + "\n";
                    }
                } else {
                    console.log("Found " + response.length + " patients: " + patient_name + response[0].id);
                    html_output += "Found " + response.length + " patient resources with given name " + given_name + " ID: " + response[0].id +"\n";
                    console.log(response);
                    if (reset_patients === "true") {
                        for (i = 0; i < response.length; i++) {
                            var patient_id = response[i].id;
                            console.log("Deleted patient observation data.");
                            html_output += "Deleting patient observation data for patient with name " + given_name + "\n";
                            delete_patient_observations(patient_id);
                            //delete_patient(patient_id);
                        }
                    } else {
                        console.log("Checking patient observation data.");
                        var patient_id = response[0].id;
                        get_patient_observation(patient_id);
                    }
                }
                document.getElementById("Output").innerHTML = html_output;
            }
        );
    }

    function delete_patient(patient_id) {
        client.delete(`Patient/${patient_id}`).then(
            function (response) {
                console.log(response.issue);
            }
        );
    }

    function create_new_patient(given_name, family_name, dob, gender) {
        dob = new Date(dob).toISOString();
        const patient_json = {
            "resourceType": "Patient",
            "name": [{
                "family": family_name,
                "given": given_name,
            }],
            "birthDate": dob,
            "gender": gender,
        };

        client.create(patient_json).then(
            function (response) {
                console.log(response.issue);
            }
        );
    }

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
            'http://loinc.org|20564-1',
        ].join(","));

        client.request("Observation?" + query, {
            pageLimit: 0,
            flat: true
        }).then(
            function (response) {
                console.log("Observation - patient ID: " + patient_id);
                console.log("Deleting...");

                for (i = 0; i < response.length; i++) {
                    var ob_id = response[i].id;
                    client.delete(`Observation/${ob_id}`).then(
                        function (response) {
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
            'http://loinc.org|20564-1',
        ].join(","));

        client.request("Observation?" + query, {
            pageLimit: 0,
            flat: true
        }).then(
            function (response) {
                console.log("Observation - " + patient_id);
                html_output += "Found " + response.length + " observations\n";
                if (response.length === 0 && reset_patients !== "checking_only") {
                    console.log("Created new observation:");
                    html_output += "Created new observations.\n";
                    var heart_ob = generate_vital_sign_observation_json(init_heart_rate, patient_id);
                    var respiratory_ob = generate_vital_sign_observation_json(init_respiratory_rate, patient_id);
                    var temperature_ob = generate_vital_sign_observation_json(init_temperature, patient_id);
                    var d_blood_pressure_ob = generate_vital_sign_observation_json(init_diastolic_blood_pressure, patient_id);
                    var s_blood_pressure_ob = generate_vital_sign_observation_json(init_systolic_blood_pressure, patient_id);
                    var oxygen_level_ob = generate_vital_sign_observation_json(init_oxygen_level, patient_id);
                    console.log("ob - heart rate");
                    create_vital_observation(heart_ob);
                    console.log("ob - respiratory");
                    create_vital_observation(respiratory_ob);
                    console.log("ob - temperature");
                    create_vital_observation(temperature_ob);
                    console.log("ob - Dystolic Pressure");
                    create_vital_observation(d_blood_pressure_ob);
                    console.log("ob - Systolic Pressure");
                    create_vital_observation(s_blood_pressure_ob);
                    console.log("ob - Oxygen Level");
                    create_vital_observation(oxygen_level_ob);
                } else {
                    console.log("Found " + response.length + " observations:");
                    console.log(response);
                }

                document.getElementById("Output").innerHTML = html_output;
            }
        );
    }

    function create_vital_observation(ob) {
        client.create(ob).then(
            function (ob) {
                console.log(ob);
            }
        );
    }

    function generate_vital_sign_observation_json(data, patient_id) {
        var time = new Date().toISOString();
        const observation_json = {
            resourceType: 'Observation',
            category: [
                {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                            code: 'vital-signs',
                            display: 'Vital Signs',
                        },
                    ],
                    text: 'Vital Signs',
                },
            ],
            code: {
                coding: [
                    {
                        system: 'http://loinc.org',
                        code: data.code,
                        display: data.text,
                    },
                ],
                text: data.text,
            },
            subject: {
                reference: `Patient/${patient_id}`,
            },
            effectiveDateTime: time,
            valueQuantity: {
                value: data.value,
                unit: data.unit,
                system: "https://unitsofmeasure.org"
            },
        };
        return observation_json;
    }
    document.getElementById("Output").innerHTML = html_output;
}