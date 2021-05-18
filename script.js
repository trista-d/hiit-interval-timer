if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} // if

let workoutNames = {}; // object containing user-submitted workout details
let workoutTimes = {}; // object containing user-submitted workout durations
let customTimes = {}; // object containg user-submitted custom interval durations
let customNames = {}; // object containg user-submitted custom interval names
let startPos = {} // object contaning which index of the progress bar each custom interval starts at

let toRemove = []  // checkboxes of custom intervals (used in deleting them)

let supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints; // check to see if slider needs to be touch compatible
let total = 0; // total workout time in seconds
let start = 0; // which interval gap to start the custom interval in 
let numCustoms = 0; // number of custom intervals the user has added
let lastRounds = 0; // the number of rounds previously entered
let isPaused = false;
let t = 0; // seconds to decrement in the timer
window.onload = function() {
  dragElement(document.getElementById("draggable"));
  
  document.getElementById('grid').addEventListener('change', function(event) {

    
    // close any open popovers to avoid stacking them 
    $("[data-bs-toggle='popover']").popover('hide');
    
    // get current workout values  
    getInputs();
    
    // re-calculate the workout preview bar
    calculateWorkout(document.getElementById("preview"));
  });
}

// handle custom interval slider
function dragElement(elmnt) {
  let pos1 = 0, pos3 = 0;
  let bar = document.getElementById("addProgress"); // container element for progress bar sections
  
  elmnt.onmousedown = dragMouseDown;
  elmnt.ontouchstart = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
   // e.preventDefault();
    
    // get the mouse cursor position at startup:
    if (supportsTouch) {
      pos3 = e.touches[0].clientX; 
    } else {
      pos3 = e.clientX;
    }
    
    // caculate the slider's ending position when the slider stops being dragged
    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;
    
    // calculate slider position whenever the mouse moves
    document.onmousemove = elementDrag; 
    document.ontouchmove = elementDrag;  
  }

  function elementDrag(e) {
   // e = e || window.event;
    //e.preventDefault();
    
    // calculate the new cursor position
        // get the mouse cursor position at startup:
    if (supportsTouch) {
      pos1 = pos3 - e.touches[0].clientX;
      pos3 = e.touches[0].clientX;
    } else {
      pos1 = pos3 - e.clientX;
      pos3 = e.clientX;
    }

    // set the element's new position
    let newPosition = elmnt.offsetLeft - pos1;
    
    if (newPosition > bar.offsetWidth) {
      newPosition = bar.offsetWidth;
    } else if (newPosition < (bar.style.left + elmnt.offsetWidth)) {
      newPosition = bar.style.left;
    } // if
    
    elmnt.style.left = newPosition + "px";
  } // elementDrag

  function closeDragElement() {
    
    // snap slider handle to nearest space between intervals
    let positions = document.getElementById("addProgress").getElementsByClassName("progress-bar");    
    let sum = 0; // position in progress bar
    
    let differenceA = 0;
    let differenceB = Math.abs(elmnt.style.left.replace("px", "") - sum);
    
    let left = 0; // pixel position to set slider at
    
    start = 0;
    
    // find which interval gap the slider is closest to
    for (let i = 0; i < positions.length; i++) {
      sum += positions[i].offsetWidth;
      
      // find number of pixels between slider handle and interval gap
      differenceA = Math.abs(elmnt.style.left.replace("px", "") - sum);

      // set handle's position to the nearest place between intervals
      if (differenceA < differenceB) {
        left = sum;
        start++; 
      } // if
      
      differenceB = differenceA;
    } // for

    if (left == 0) {
      left = 15;
    }
    
    // 'snap' the slider to the nearest interval gap
    elmnt.style.left = left + "px";

    // stop moving the slider
    document.onmouseup = null;
    document.onmousemove = null;    
    
    document.ontouchend = null;
    document.ontouchmove = null;  
  } // closeDragElement
} // dragElement

// start and display workout timer
async function beginTimer() {
  
  // ensure that no inputs are empty
  let inputs = document.getElementsByClassName("maininput");
  for ( let i = 0; i < inputs.length; i++) {
    if (inputs[i].value == "") {
      document.getElementById("alert").style.display = "block";
      return;
    }
  } // for

  getInputs();
  
      // run through each interval
    for (let time in workoutTimes) {
      if (workoutTimes[time] == "" || workoutTimes[time] == "0") {
        delete workoutTimes[time];
      } // if
    } // for
  // add warmup and cooldown if user has checked box
  if (workoutNames.warmup == "") {
    workoutTimes.warmup = 0;
  } // if

  if (workoutNames.cooldown == "") {
    workoutTimes.cooldown = 0;
  } // if
 
  // remove timer set up screen and show timer
  if (t == 0) {
    document.body.innerHTML = '<h3>' + workoutNames.timerName + '</h3><div id="container"><h1 id="name">' + workoutNames.timerName + '</h1><div id="timer"></div><button onclick="pausePlay()" id="pause" class="btn btn-secondary">Pause</button></div>';
  } // if
    
  let timer = 0, minutes, seconds;
  let name = document.getElementById("name"); // container element for interval name
  
  // run the timer for the correct number of rounds
    for (let time in workoutTimes) {
      timer = workoutTimes[time];

      
     let title = document.getElementById("name");
     let bg = document.getElementById("container"); 

     let timeSuffix = time.substring(time.indexOf('_') + 1);
     switch(true) {
        case timeSuffix == 'high':
          bg.style.backgroundColor = "#d9534f";
          name.innerHTML = workoutNames[time];
          break;
        case timeSuffix == 'low':
          bg.style.backgroundColor = "#5cb85c";
          name.innerHTML = workoutNames[time];
          break;
        case time == 'countdown':
          bg.style.backgroundColor = "#0275d8";
          name.innerHTML = workoutNames.countdown;
          break;    
       case time == 'warmup':
          bg.style.backgroundColor = "#f0ad4e";
          name.innerHTML = "Warmup";
          break;
       case time == 'cooldown':
          bg.style.backgroundColor = "#f0ad4e";
          name.innerHTML ="Cooldown";
          break;
       default:  
         bg.style.backgroundColor = "#6f42c1";
         name.innerHTML = workoutNames[time];
      }
        await showTimer(timer, time);
    } // for
  //}
  
  document.body.innerHTML = "<h1>Congratulations! Workout finished</h1>";
} // beginTimer

let showTimer = async function showTimer(timer, time) {
  t = timer;  
  
  while (t >= 0) {
    while (isPaused) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
  let    minutes = parseInt(t / 60, 10)
  let    seconds = parseInt(t % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    document.getElementById("timer").textContent = minutes + ":" + seconds;

    await new Promise(r => setTimeout(r, 1000));
    t--;
  } // while
} // showTimer

// pause or play the timer
function pausePlay() {
  if (isPaused) {
    isPaused = false;
    document.getElementById("pause").innerHTML = 'Pause';
  } else {
    document.getElementById("pause").innerHTML = 'Play';
    isPaused = true;
  } // else
} // pause

// calculate a workout preview and display it using a bootstrap progress bar
function calculateWorkout(bar) {
  
  // clear old progress bar
  bar.innerHTML = "";

  // get total workout time
  calcTotal();
  
  document.getElementById("forPreview").innerHTML = "<b>Total time: " + total + " seconds</b><br>Hover over or click the intervals below to view their details";
  
  //for (let i = 0; i < workoutNames.rounds; i++) {
    for (let time in workoutTimes) {
      if (time != "countdown" && workoutTimes[time] != "") {
/*      
      // don't show warmup and cooldown during middle rounds
      if (i > 0 && time == "warmup") {
        continue;
      } else if (i != workoutNames.rounds - 1 && time == "cooldown") {
        continue;
      } // else
        
      if (i != workoutNames.rounds -1 && time.includes("custom")) {
        continue;
      } // else
  */      
        let interval = document.createElement('DIV');
        
        interval.setAttribute("data-bs-toggle", "popover");
        interval.setAttribute("data-bs-placement", "top");
        interval.setAttribute("data-bs-trigger", "hover");
        interval.setAttribute("title", "title");
        interval.setAttribute("container", "body");
        interval.setAttribute("data-bs-placement", "top");
        
        let timeSuffix = time.substring(time.indexOf('_') + 1);
        
        if (workoutNames[time] == "") {
          interval.setAttribute("title", timeSuffix + " intensity");
        } else {
          interval.setAttribute("title", workoutNames[time]);
        } // else
        
        interval.setAttribute("data-bs-content", workoutTimes[time] + " seconds");
          
        interval.style.width = (workoutTimes[time] / total * 100)  + "%";

        switch(true) {
          case time == "warmup":
            interval.style.backgroundColor = "#f0ad4e";
            break;
          case timeSuffix == "high":
            interval.style.backgroundColor = "#d9534f";
            break;
          case timeSuffix == "low":
            interval.style.backgroundColor = "#5cb85c";
            break;
          case time == "cooldown":
            interval.style.backgroundColor = "#f0ad4e";
            break;
          default:  
            interval.style.backgroundColor = "#6f42c1";
        } // switch.
        
        
        interval.setAttribute("class", "progress-bar");

/*        if (i == workoutNames.rounds - 1 && time.includes("custom")) {   
          bar.insertBefore(interval, bar.children[startPos[time]]);
        } else {
  */        bar.appendChild(interval);
    //    } // else
        
        // initialize bootstrap popovers
        $('[data-bs-toggle="popover"]').popover();
      } // if
    } // for
  //} // for
} // calculateWorkout

// display duration input when warmup or cooldown box is checked
function showDuration(checkbox, id) {
  let elem = document.getElementById(id); 
  if (checkbox.checked) {
    elem.style.display = "block";
  } else {
    elem.style.display = "none";
    document.getElementById(checkbox.id + "Duration").value = 0;
  } // else
  
  // update progress bar
  calculateWorkout(document.getElementById("preview"));
} // showDuration

// sum all intervals to get total workout time
function calcTotal() {
  total = 0;
  
  // sum workoutTimes
//  for (let i = 0; i < workoutNames.rounds; i++) {
    for (let time in workoutTimes) {
/*      if (i > 0 && time == "warmup") {
        continue;
      } else if (i != workoutNames.rounds - 1 && time == "cooldown") {
        continue;
      } else if (time == "countdown") {
        continue;
      } else if (i > 0 && time.includes('custom')) {
        continue;
      } // if
*/      
      if (workoutTimes[time] == "" || time == "countdown") {
        continue;
      }
      total += parseInt(workoutTimes[time]);
    } // for
//  } // for
} // calcTotal

// save user-inputted values
function getInputs() {
  // Clear out any extra intervals (in case # of rounds has been reduced)
  let newRounds = document.getElementById("rounds").value;
  
  // If there's no rounds, then nothing to do
  if (newRounds == "" || newRounds == "0") {
    return;
  }
  
  console.log("newRounds: " + newRounds);
  console.log("workoutNames['rounds']: " + workoutNames['rounds']);
  console.log("lastRounds:" + lastRounds);
  if (parseInt(lastRounds) > parseInt(newRounds)) {
    let key = newRounds + '_high';
    console.log('key: ' + key);
    let keyValues = Object.entries(workoutTimes);
    console.log(keyValues);
    let index = keyValues.findIndex(x => x[0] == key);
    console.log("index: " + index);
    if (index > -1) {
      console.log("Found key, deleting items");
      keyValues.splice(index);
      workoutTimes = Object.fromEntries(keyValues);
    }
    console.log(workoutTimes);
  }
  
  workoutNames ['timerName'] = document.getElementById("timerName").value;
  workoutNames ['rounds'] = document.getElementById("rounds").value;
  workoutNames ['countdown'] = "Get Ready to Begin in...";
  workoutNames ['warmup'] = "Warmup";
  workoutNames ['cooldown'] = "Cooldown";
  
  workoutTimes ['countdown'] = document.getElementById("countdown").value;
  workoutTimes ['warmup'] = document.getElementById("warmupDuration").value;
  
  delete workoutTimes['cooldown'];
  
  for (let i = 0; i < document.getElementById("rounds").value; i++) {
    workoutNames [i + '_high'] = document.getElementById("highName").value;
    workoutNames [i + '_low'] = document.getElementById("lowName").value;
    workoutTimes [i + '_high'] = document.getElementById("highDuration").value;
    workoutTimes [i + '_low'] = document.getElementById("lowDuration").value;
  }
  workoutTimes ['cooldown'] = document.getElementById("cooldownDuration").value;
  
  lastRounds = newRounds;
} // getInputs
// add custom interval
function addCustom() {
  numCustoms++;
  
  //workoutTimes['custom' + numCustoms] = document.getElementById("newDuration").value;
  startPos['custom' + numCustoms] = start;

  // add interval to removal list
  let label = "";
  if (document.getElementById("newName").value == "")  {
    label = "Custom " + numCustoms;
    workoutNames['custom' + numCustoms] = label;
  } else {
    workoutNames['custom' + numCustoms] = document.getElementById("newName").value;
    label = document.getElementById("newName").value;
  } // else
  
  // insert the interval to the workout
  let keyValues = Object.entries(workoutTimes);
  keyValues.splice(++start,0, ['custom' + numCustoms, document.getElementById("newDuration").value]);
  workoutTimes = Object.fromEntries(keyValues);
  
  let name = 'custom' + numCustoms;
  
  let container = document.createElement('DIV');
  let modal = document.getElementById("removeBody");   
  modal.appendChild(container);
  let check = document.createElement('INPUT');
  check.setAttribute("class", "form-check-input");
  check.setAttribute("type", "checkbox");
  check.setAttribute("id", name);
  container.appendChild(check);
  let checkLabel = document.createElement('LABEL');
  checkLabel.setAttribute("class", "form-check-label");
  checkLabel.setAttribute("for", name);
  checkLabel.innerHTML = "&nbsp;" + label;
  container.appendChild(checkLabel);
  
  toRemove.push(document.getElementById('custom' + numCustoms));
  
  calculateWorkout(document.getElementById("preview"));
  
  // clear modal inputs
  document.getElementById("newName").value = "";
  document.getElementById("newDuration").value = "";
} // addCustom

// delete selected custom intervals 
function removeCustom() {
  for (let i = 0; i < toRemove.length; i++) {
    if (toRemove[i].checked) {
      delete workoutNames[toRemove[i].id];
      delete workoutTimes[toRemove[i].id];

      toRemove[i].parentNode.remove();
    } // if
  } // for
  
  calculateWorkout(document.getElementById("preview"));
} // removeCustom

// delete all custom intervals
function deleteAll() {
  for (let i = 0; i < toRemove.length; i++) {
       delete workoutNames[toRemove[i].id];
       delete workoutTimes[toRemove[i].id];
    
    toRemove[i].parentNode.remove();
  } // for
  
  calculateWorkout(document.getElementById("preview"));
} // deleteAll

// display preset workout
function setPresets(i) {
  const presets = [
    { 
      timerName: "1-to-3",
      rounds: "8",
      countdown: "10",
      highDuration: "30",
      highName: "jumping jacks",
      lowDuration: "90",
      lowName: "rest",
      warmupDuration: "300",
      cooldownDuration: "180"
    },
    { 
      timerName: "1-to-1",
      rounds: "10",
      countdown: "10",
      highDuration: "45",
      highName: "jump squats",
      lowDuration: "45",
      lowName: "rest",
      warmupDuration: "300",
      cooldownDuration: "240"
    },   
    { 
      timerName: "2-to-1",
      rounds: "12",
      countdown: "10",
      highDuration: "40",
      highName: "mountain climbers",
      lowDuration: "20",
      lowName: "rest",
      warmupDuration: "300",
      cooldownDuration: "300"
    },
  ];
  
  if (i == 3) {
    return;
  } // if
  
 for (let val in presets[i]) {
   document.getElementById(val).value = presets[i][val];
   console.log(val);
 } // for
  workoutNames = {};
  workoutTimes = {};
  document.getElementById("removeBody").innerHTML = "";
} // setPresets


// nicer workout screen 
// nicer workout finish screen
// pause button
// add preset values
// validate HTML and CSS
// rounds need to update on input change so calcuation isn't wrong
