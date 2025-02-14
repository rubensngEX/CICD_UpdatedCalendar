// Utility function to handle API requests with token in headers
export async function customFetch(url, options = {}) {
  const notyf = new Notyf();
  const token = localStorage.getItem("token"); // Retrieve the token from localStorage

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // Only add Content-Type if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text(); // Log the response text
    console.error(`Fetch error: ${response.statusText}, Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
