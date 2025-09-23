export const getHeader = async (): Promise<void> => {
  fetch('Components/Header/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      const headerElement = document.getElementById('header');
      if (headerElement) {
        headerElement.innerHTML = html;
      }
    })
    .catch(error => {
      console.error('Error loading header:', error);
    });
};

export const getFooter = async (): Promise<void> => {
  fetch('Components/Footer/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      const footerElement = document.getElementById('footer');
      if (footerElement) {
        footerElement.innerHTML = html;
      }
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
};
