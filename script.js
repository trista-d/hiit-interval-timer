if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
} // if


let workoutNames = {}; // object containing user-submitted workout details
let workoutTimes = {}; // object containing user-submitted workout durations
let customTimes = {}; // object containg user-submitted custom interval durations
let customNames = {}; // object containg user-submitted custom interval names
let startPos = {} // object contaning which index of the progress bar each custom interval starts at

let toRemove = []  // checkboxes of custom intervals (used in deleting them)

let total = 0; // total workout time in seconds
let start = 0; // which interval gap to start the custom interval in 
let numCustoms = 0; // number of custom intervals the user has added

window.onload = function() {
  dragElement(document.getElementById("draggable"));
  
  document.getElementById('grid').addEventListener('change', function(event) {
    
    // get current workout values  
    getInputs();
    
    calculateWorkout(document.getElementById("preview"));
  });
}

// handle custom interval slider
function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0;
  let bar = document.getElementById("addProgress"); // container element for progress bar sections
  
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
    // get the mouse cursor position at startup:
    pos3 = e.clientX;

    document.onmouseup = closeDragElement;
    elmnt.ontouchend = closeDragElement;
    
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;  
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // calculate the new cursor position
    pos1 = pos3 - e.clientX;
  
    pos3 = e.clientX;

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
    let differenceB = Math.abs(elmnt.style.left.replace("px", "") - sum);;
    
    let left = 0; // pixel position to set slider at
    
    start = 0;
    
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
    elmnt.style.left = left + "px";

    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;    
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
  
  // add warmup and cooldown if user has checked box
  if (workoutNames.warmup == "") {
    workoutTimes.warmup = 0;
  } // if

  if (workoutNames.cooldown == "") {
    workoutTimes.cooldown = 0;
  } // if
 
  // remove timer set up screen and show timer
  document.body.innerHTML = '<h3>' + workoutNames.timerName + '</h3><div id="container"><h1 id="name">' + workoutNames.timerName + '</h1><div id="timer"></div></div>';
// <button class="btn btn-secondary">Pause (does not work yet)</button>
  let timer = 0, minutes, seconds;
  let name = document.getElementById("name"); // container element for interval name
  
  // run the timer for the correct number of rounds
  //for (let j = 0; j < workoutNames.rounds; j++) {
    
    // run through each interval
    for (let time in workoutTimes) {
      timer = workoutTimes[time];
      
      // don't show warmup, cooldown, and countdown during middle rounds
//      if (j > 0 && time == 'warmup') {
//        continue;
//      } else if (j > 0 && time == 'countdown') {
//        continue;
//      } else if (j != workoutNames.rounds - 1 && time == 'cooldown') {
//        continue;
//      } // if
      
     let title = document.getElementById("name");
     let bg = document.getElementById("container"); 

     let timeSuffix = time.substring(1);
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
  let t = timer;  
  
  while (t >= 0) {
  let    minutes = parseInt(t / 60, 10)
  let    seconds = parseInt(t % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    document.getElementById("timer").textContent = minutes + ":" + seconds;

    await new Promise(r => setTimeout(r, 1000));
    t--;
  } // while
}

// calculate a workout preview and display it using a bootstrap progress bar
function calculateWorkout(bar) {
  /*if (bar.id == "addProgress") {
    document.getElementById("draggable").style.left = "0";
  } // if*/
  
  // clear old progress bar
  bar.innerHTML = "";

  // get total workout time
  calcTotal();
  
  document.getElementById("forPreview").innerHTML = "Total time: " + total + " seconds";
  
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
        
        let timeSuffix = time.substring(1);
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
  workoutNames ['timerName'] = document.getElementById("timerName").value;
  workoutNames ['rounds'] = document.getElementById("rounds").value;
  workoutNames ['countdown'] = "Get Ready to Begin in...";
  workoutNames ['warmup'] = "Warmup";
  workoutNames ['cooldown'] = "Cooldown";
  
  workoutTimes ['countdown'] = document.getElementById("countdown").value;
  workoutTimes ['warmup'] = document.getElementById("warmupDuration").value;
  
  delete workoutTimes['cooldown'];
  
  for (let i = 0; i < document.getElementById("rounds").value; i++) {
    workoutNames [i + 'high'] = document.getElementById("highName").value;
    workoutNames [i + 'low'] = document.getElementById("lowName").value;
    workoutTimes [i + 'high'] = document.getElementById("highDuration").value;
    workoutTimes [i + 'low'] = document.getElementById("lowDuration").value;
  }
  workoutTimes ['cooldown'] = document.getElementById("cooldownDuration").value;
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

// add touchevents for slider
// better workout screen 
// optimize pwa
// better workout finish screen
// pause button
// get pwa icons
// validate HTML and CSS