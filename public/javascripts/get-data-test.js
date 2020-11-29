//adapted from the cerner smart on fhir guide. updated to utilize client.js v2 library and FHIR R4


//create a fhir client based on the sandbox environment and test patient.
const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
    patient: "5214a564-9117-4ffc-a88c-25f90239240b"
  }
});

var xdata = d3.range(0, 20);
var ydata = [1, 4, 5, 9, 10, 14, 15, 15, 11, 10, 5, 5, 4, 8, 7, 5, 5, 5, 8, 10];

// d3.js functions want x,y data in a not-so-intuitive structure
// Assemble the needed array structure (Thanks to FernofTheAndes on SO)
// The new structure is technically an array of objects.
// Each object has the structure {property: value}
// In this case, each object is one x, y pair

var test_data = []; // start empty, add each element one at a time
for(var i = 0; i < xdata.length; i++ ) {
   test_data.push({x: xdata[i], y: ydata[i]});
}

function make_plot(dataset,color,title,x_label,y_label) {
    console.log(dataset);
    var colors = d3.schemeCategory10;

    var offset = 50;
    var margin = {top: offset, right: offset, bottom: offset, left: offset};
    var width = window.innerWidth/2 - margin.left - margin.right;
    var height = window.innerHeight/2 - margin.top - margin.bottom;

    var xScale = d3.scaleTime()
        .domain(d3.extent(dataset, function(d) {return d.x;}))
        .range([0, width]);

    var y_range = d3.extent(dataset, function(d) {return d.y;});
    var yScale = d3.scaleLinear()
        .domain([y_range[0]-2, y_range[1]+2])
        .range([height, 0]);

    var line = d3.line()
        .x(function(d) { return xScale(d.x);})
        .y(function(d) { return yScale(d.y);})
        .curve(d3.curveMonotoneX)

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

    svg.append("path")
        .datum(dataset)
        .attr("class", "line")
        .attr("d", line)
        .style("stroke",color);

    svg.append("text")
        .attr("x", (width-offset) / 2)
        .attr("y", 0)
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .text(title);

    svg.append("text").attr("x", -height / 2).attr("y", -40).attr("transform", "rotate(-90)")
        .style("font-size", "12px").style("font-weight", "bold")
        .style("text-anchor", "middle").text(y_label);

    svg.append("text").attr("x", width / 2).attr("y", height+30)
        .style("font-size", "12px").style("font-weight", "bold")
        .style("text-anchor", "middle").text(x_label);

}
// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of medications
function displayMedication(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseInt((ob.valueQuantity.value))) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value: ''
    },
    dia: {
      value: ''
    },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
  //hdl.innerHTML = obs.hdl;
  //ldl.innerHTML = obs.ldl;
  //sys.innerHTML = obs.sys;
  //dia.innerHTML = obs.dia;
  height.innerHTML = obs.height;
  weight.innerHTML = obs.weight;
}

// get patient object and then display its demographics info in the banner
client.request(`Patient/${client.patient.id}`).then(
  function(patient) {
    displayPatient(patient);
  }
);

// get observation resoruce values
// you will need to update the below to retrive the weight and height values
var query = new URLSearchParams();

query.set("patient", client.patient.id);
query.set("_count", 100);
query.set("_sort", "-date");
query.set("code", [
  'http://loinc.org|8462-4',
  'http://loinc.org|8480-6',
  'http://loinc.org|2085-9',
  'http://loinc.org|2089-1',
  'http://loinc.org|55284-4',
  'http://loinc.org|3141-9',
  'http://loinc.org|8302-2',
  'http://loinc.org|29463-7',
  'http://loinc.org|9279-1',
  'http://loinc.org|8310-5',
].join(","));

client.request("Observation?" + query, {
  pageLimit: 0,
  flat: true
}).then(
  function(ob) {

    // group all of the observation resources by type into their own
    var byCodes = client.byCodes(ob, 'code');
    var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
    var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
    var hdl = byCodes('2085-9');
    var ldl = byCodes('2089-1');
    var height = byCodes('8302-2');
    var weight = byCodes('29463-7');
    var respiratory_rate = byCodes('8310-5');
    console.log("repiratory",respiratory_rate);
    // create patient object
    var p = defaultPatient();

    // set patient value parameters to the data pulled from the observation resoruce
    if (typeof systolicbp != 'undefined') {
      p.sys = systolicbp;
    } else {
      p.sys = 'undefined'
    }

    if (typeof diastolicbp != 'undefined') {
      p.dia = diastolicbp;
    } else {
      p.dia = 'undefined'
    }

    p.hdl = getQuantityValueAndUnit(hdl[0]);
    p.ldl = getQuantityValueAndUnit(ldl[0]);
    p.height = getQuantityValueAndUnit(height[0]);
    p.weight = getQuantityValueAndUnit(weight[0]);
    console.log("HEIGHT",height)
    console.log("WEIGHT",weight)
    var weight_data = []; // start empty, add each element one at a time
    var weight_unit;
    for(var i = 0; i < weight.length; i++ ) {
        weight_data.push({x: d3.isoParse(weight[i]["effectiveDateTime"]) , y: Number(parseFloat((weight[i].valueQuantity.value)).toFixed(2))});
        weight_unit = weight[i].valueQuantity.unit;
    }


    var height_data = []; // start empty, add each element one at a time
    var height_unit;
    var bmi_data = [];
    for(var i = 0; i < height.length; i++ ) {
        height_tmp = Number(parseFloat((height[i].valueQuantity.value)).toFixed(2));
        height_data.push({x: d3.isoParse(height[i]["effectiveDateTime"]) , y: height_tmp });
        height_unit = height[i].valueQuantity.unit;
        bmi_data.push({x: d3.isoParse(height[i]["effectiveDateTime"]), y: weight_data[i]['y']*10000/height_tmp/height_tmp});
    }

    //make_plot(height_data,"blue","Height Chart","Year", height_unit.toUpperCase());
    //make_plot(weight_data,"gold","Weight Chart", "Year", weight_unit.toUpperCase());
    //make_plot(bmi_data,"red","BMI Chart", "Year","kg/cm");
    displayObservation(p);
  });

var query = new URLSearchParams();

query.set("patient", client.patient.id);
query.set("_count", 1000000);
query.set("_sort", "-date");

//http://docs.smarthealthit.org/client-js/request.html
function getMedicationName(medCodings = []) {
  var coding = medCodings.find(c => c.system === rxnorm);
  return coding && coding.display || "Unnamed Medication(TM)";
}

function display(data) {
  // dummy data for medrequests
  var medResults = data
  //medResults = [];
  if (!medResults.length) {
    medResults = ["No medication is found."];
  }
  // get medication request resources this will need to be updated
  // the goal is to pull all the medication requests and display it in the app. It can be both active and stopped medications
  medResults.forEach(function(med) {
    //displayMedication(med);
  })
}

const rxnorm  = "http://www.nlm.nih.gov/research/umls/rxnorm";
const getPath = client.getPath;
client.request("/MedicationRequest?" + query, {
    resolveReferences: "medicationReference"
}).then(data => data.entry.map(item => getMedicationName(
    getPath(item, "resource.medicationCodeableConcept.coding") ||
    getPath(item, "resource.medicationReference.code.coding")
))).then(display,display);




