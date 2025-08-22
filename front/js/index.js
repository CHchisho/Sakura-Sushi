function main() {
  fetch('Components/Header/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      document.getElementById('header').innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading header:', error);
    });

  fetch('Components/Footer/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      document.getElementById('footer').innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
}

main();
