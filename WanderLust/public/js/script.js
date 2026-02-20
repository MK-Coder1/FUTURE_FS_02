// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
     'use strict'

     // Fetch all the forms we want to apply custom Bootstrap validation styles to
     const forms = document.querySelectorAll('.needs-validation')

     // Loop over them and prevent submission
     Array.from(forms).forEach(form => {
          form.addEventListener('submit', event => {
               if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
               }

               form.classList.add('was-validated')
          }, false)
     })
})()


// For Form Range Style
// This is an example script, please modify as needed
const rangeInput = document.getElementById('range');
const rangeOutput = document.getElementById('rangeValue');

// Set initial value
rangeOutput.textContent = rangeInput.value;

rangeInput.addEventListener('input', function () {
     rangeOutput.textContent = this.value;
});