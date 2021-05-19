if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} // if

let workoutNames = {}; // object containing user-submitted workout details
let workoutTimes = {}; // object containing user-submitted workout durations
let customTimes = {}; // object containg user-submitted custom interval durations
let customNames = {}; // object containg user-submitted custom interval names
let startPos = {} // object contaning which index of the progress bar each custom interval starts at
let audio = -1; // index of "sounds" array to play
let supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints; // check to see if slider needs to be touch compatible
 
let toRemove = [];  // checkboxes of custom intervals (used in deleting them)
let sounds = new Array(3); // all sound files

let total = 0; // total workout time in seconds
let start = 0; // which interval gap to start the custom interval in 
let numCustoms = 0; // number of custom intervals the user has added
let lastRounds = 0; // the number of rounds previously entered
let isPaused = false;
let t = 0; // seconds to decrement in the timer
window.onload = function() {
  dragElement(document.getElementById("draggable"));
  
  // load audio files
  for (let i = 0; i < sounds.length; i++) {
    sounds[i] = new Audio("sounds/" + i + ".wav");
  } // for
  document.getElementById('grid').addEventListener('change', function(event) {

    
    // close any open popovers to avoid stacking them 
    $("[data-bs-toggle='popover']").popover('hide');
    
    // get current workout values  
    getInputs();
    
    // re-calculate the workout preview bar
    calculateWorkout(document.getElementById("preview"));
  }, {passive: true});
}

// handle custom interval slider
function dragElement(elmnt) {
  let pos1 = 0, pos3 = 0;
  let bar = document.getElementById("addProgress"); // container element for progress bar sections
  
  elmnt.onmousedown = dragMouseDown;
  elmnt.addEventListener('touchstart', dragMouseDown, {passive: true});
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
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
    } else {
      left += 4.5;
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

  // save user input values
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
    document.body.innerHTML = '<h3 class="display-1 text-center" id="timerName">' + workoutNames.timerName + '</h3><div id="container"><p id="name" class="display-3">' + workoutNames.timerName + '</p><div id="timer"></div><button onclick="pausePlay()" id="pause" class="btn btn-lg">Pause</button>'+'</div>';
  } // if
    
  let timer = 0, minutes, seconds;
  let name = document.getElementById("name"); // container element for interval name
  
  // run the timer for the correct number of rounds
    for (let time in workoutTimes) {
      timer = workoutTimes[time];

     // detach incremented number from key name
     let timeSuffix = time.substring(time.indexOf('_') + 1);
     
      // display correct background color
      switch(true) {
        case timeSuffix == 'high':
          document.body.style.backgroundColor = "#d9534f";
          name.innerHTML = workoutNames[time];
          break;
        case timeSuffix == 'low':
          document.body.style.backgroundColor = "#5cb85c";
          name.innerHTML = workoutNames[time];
          break;
        case time == 'countdown':
          document.body.style.backgroundColor = "#0275d8";
          name.innerHTML = workoutNames.countdown;
          break;    
       case time == 'warmup':
          document.body.style.backgroundColor = "#f0ad4e";
          name.innerHTML = "Warmup";
          break;
       case time == 'cooldown':
          document.body.style.backgroundColor = "#f0ad4e";
          name.innerHTML ="Cooldown";
          break;
       default:  
         document.body.style.backgroundColor = "#6f42c1";
         name.innerHTML = workoutNames[time];
      } // switch
      
      // play timer audio at start of each interval (except countdown)
      if (audio < 3) {
        sounds[audio].playbackRate = 2;
        sounds[audio].play();
      } // if
      
    // wait for the timer to tick down to zero before running the loop again
    await showTimer(timer, time);
    } // for
  
  document.body.style.backgroundColor = "#fff";
  document.body.innerHTML = '<div class="mx-auto text-center"><h1 class="mx-auto text-center" id="congrats">Congratulations,</h1><p class="display-3 mx-auto text-center" id="finished">Workout finished!</p><button class="btn mx-auto text-center" id="newWorkout" onclick="location.reload()">New Workout</button></div>';
} // beginTimer

// grpahically and mathematically decrement the timer in seconds 
let showTimer = async function showTimer(timer, time) {
  t = timer;  
  
  while (t >= 0) {
    while (isPaused) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    let minutes = parseInt(t / 60, 10)
    let seconds = parseInt(t % 60, 10);

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
  
  // display total seconds of workout
  document.getElementById("forPreview").innerHTML = "<b>Total time: " + total + " seconds</b><br>Hover over or click the intervals below to view their details";
  
    for (let time in workoutTimes) {
      if (time != "countdown" && workoutTimes[time] != "") {

        let interval = document.createElement('DIV'); // interval to go on progress bar
        
        // add popup window on hover or click of interval on progress bar
        interval.setAttribute("data-bs-toggle", "popover");
        interval.setAttribute("data-bs-placement", "top");
        interval.setAttribute("data-bs-trigger", "hover");
        interval.setAttribute("title", "title");
        interval.setAttribute("container", "body");
        interval.setAttribute("data-bs-placement", "top");
        
        let timeSuffix = time.substring(time.indexOf('_') + 1);
        
        // if user doesn't set name, use generic name for popup
        if (workoutNames[time] == "") {
          interval.setAttribute("title", timeSuffix + " intensity");
        } else {
          interval.setAttribute("title", workoutNames[time]);
        } // else
        
        interval.setAttribute("data-bs-content", workoutTimes[time] + " seconds");
          
        // calculate what fraction of 
        interval.style.width = (workoutTimes[time] / total * 100)  + "%";

        // display correct progress bar color for each interval
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

        bar.appendChild(interval);
        
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
    document.getElementById(checkbox.id + "Duration").value = "";
  } // else
  
  // update progress bar
  getInputs();
  calculateWorkout(document.getElementById("preview"));
} // showDuration

// sum all intervals to get total workout time
function calcTotal() {
  total = 0;
  
  // sum workoutTimes but exclude countdown
    for (let time in workoutTimes) {    
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
  if (newRounds == "") {
    newRounds = 0;
  }
  if (parseInt(lastRounds) > parseInt(newRounds)) {
    let key = newRounds + '_high';
    let keyValues = Object.entries(workoutTimes);
    let index = keyValues.findIndex(x => x[0] == key);
    if (index > -1) {
      keyValues.splice(index);
      workoutTimes = Object.fromEntries(keyValues);
    }
  } // if
   
  // get index of audio to use in workout
  audio = document.getElementById("sound").value;
  
  workoutNames ['timerName'] = document.getElementById("timerName").value;
  workoutNames ['rounds'] = document.getElementById("rounds").value;
  workoutNames ['countdown'] = "Get Ready to Begin in...";
  workoutNames ['warmup'] = "Warmup";
  workoutNames ['cooldown'] = "Cooldown";
  
  workoutTimes ['countdown'] = document.getElementById("countdown").value;
  workoutTimes ['warmup'] = document.getElementById("warmupDuration").value;
  
  // delete cooldown so it will stay last in the object
  delete workoutTimes['cooldown'];
  
  // save the correct number interval based on how many rounds the user has set
  for (let i = 0; i < document.getElementById("rounds").value; i++) {
    workoutNames [i + '_high'] = document.getElementById("highName").value;
    workoutNames [i + '_low'] = document.getElementById("lowName").value;
    workoutTimes [i + '_high'] = document.getElementById("highDuration").value;
    workoutTimes [i + '_low'] = document.getElementById("lowDuration").value;
  }
  workoutTimes ['cooldown'] = document.getElementById("cooldownDuration").value;
  
  lastRounds = newRounds;
  
} // getInputs

// create custom interval
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
  
  // create checkbox for the "remove intervals" screen
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
  
  // re-caclulate workout preview
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
  
  // re-caclulate workout preview
  calculateWorkout(document.getElementById("preview"));
} // removeCustom

// delete all custom intervals
function deleteAll() {
  for (let i = 0; i < toRemove.length; i++) {
       delete workoutNames[toRemove[i].id];
       delete workoutTimes[toRemove[i].id];
    
    toRemove[i].parentNode.remove();
  } // for
  
  // re-caclulate workout preview
  calculateWorkout(document.getElementById("preview"));
} // deleteAll

// display preset workout
function setPresets(i) {
   
  // if no preset is chosen, don't do anything
  if (i == 3) {
    return;
  } // if
  
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
  
  // graphically set presets
 for (let val in presets[i]) {
   document.getElementById(val).value = presets[i][val];
 } // for
  
  // clear any previous user values
  workoutNames = {};
  workoutTimes = {};
  
  // clear list of custom intervals
  document.getElementById("removeBody").innerHTML = "";
} // setPresets
