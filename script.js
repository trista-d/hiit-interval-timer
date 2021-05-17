.col {
text-align: center;
}

.row {
}

.form-control {
  border: 1px solid #A8A8A8 !important;
}

#draggable {
  position: absolute;
  z-index: 100;
  width: 1%;
  height:30%;
  background-color: #A8A8A8;
}

#start {
  position: relative;
  left: -10px;
  font-size: 120%;
}

#draggable:hover {
  cursor: pointer;
}

#h-intensity, #c-intensity {
   border: 1px dashed #A8A8A8;
}

button[data-bs-target="#addModal"] {
  background-color: #6f42c1;
  color: white;
}

button[data-bs-target="#addModal"]:hover {
  background-color: #59359a;
  color: white;
}

button[data-bs-target="#removeModal"] {
  
}

button[data-bs-target="#removeModal"]:hover {
  
}

#warmupCont, #cooldownCont {
  width: 50%;
  margin: auto;
}

.form-check-input:checked {
    background-color: #f0ad4e !important;
    border-color: #f0ad4e !important
}

.form-check-input:focus, .btn:focus, .form-control:focus {
  border-color: #A8A8A8 !important;
  outline: 0 !important;
  box-shadow:0 0 0 0.25rem rgb(168 168 168 / 25%) !important;
}

#alert {
  padding: 2%;
  background-color: #f44336;
  color: white;
  text-align: center;
  font-size: 2vh;
  display: none;
  margin-bottom: 0.5%;
}

.closebtn {
  margin-left: 15px;
  color: white;
  font-weight: bold;
  float: right;
  font-size: 3vh;
  line-height: 20px;
  cursor: pointer;
  transition: 0.3s;
}

.closebtn:hover {
  color: black;
}

#container {
  font-size: 20vh;
  text-align: center;
}

.progress-bar:hover {
  filter: brightness(0.9);
}

.modal-dialog {
  min-width: 80%;
}
