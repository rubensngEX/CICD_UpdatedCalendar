export function customSubmit(buttonId, formId, callback) {
  const submitButton = document.getElementById(buttonId);
  const form = document.getElementById(formId);

  if (!submitButton || !form) {
    console.error(`Button or form not found for IDs: ${buttonId}, ${formId}`);
    return;
  }

  // Remove any existing event listeners to prevent duplication
  const oldSubmitHandler = form.onsubmit;
  if (oldSubmitHandler) {
    form.removeEventListener("submit", oldSubmitHandler);
  }

  let isProcessing = false;

  // Add the new event listener
  form.onsubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission

    if (isProcessing) return; // Prevent duplicate submissions during processing

    isProcessing = true;
    submitButton.disabled = true; // Disable the button
    submitButton.textContent = "Processing..."; // Update button text (optional)

    try {
      await callback(); // Execute the provided callback (e.g., API call or form logic)
      submitButton.textContent = "Success"; // Optional: Update text after success
    } catch (error) {
      console.error("Submission error:", error);
      submitButton.textContent = "Error! Try Again"; // Optional: Update text after failure
    } finally {
      isProcessing = false;
      setTimeout(() => {
        submitButton.disabled = false; // Re-enable the button
        submitButton.textContent = "Submit"; // Reset the button text
      }, 1000); // Allow re-enabling after 1 second
    }
  };
}
