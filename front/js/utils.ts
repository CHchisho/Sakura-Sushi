export const getHeader = async (): Promise<void> => {
	return new Promise((resolve, reject) => {
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
					console.log('headerElement initialized');
					resolve();
				} else {
					reject(new Error('Header element not found'));
				}
			})
			.catch(error => {
				console.error('Error loading header:', error);
				reject(error);
			});
	});
};

export const getFooter = async (): Promise<void> => {
	return new Promise((resolve, reject) => {
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
					resolve();
				} else {
					reject(new Error('Footer element not found'));
				}
			})
			.catch(error => {
				console.error('Error loading footer:', error);
				reject(error);
			});
	});
};

